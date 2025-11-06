import { prisma } from '../db'
import { Change, CreateDocumentDto, UpdateDocumentDto } from '../types/document'
import { applyChanges, isValidChange } from '../utils/applyChanges'
import { AppError } from '../middleware/errorHandler'
import { QUERY_LIMITS } from '../config/constants'
import { generateETag } from '../utils/etag'

/**
 * Wrapper to automatically handle errors in service methods
 * Converts Prisma/database errors to appropriate AppErrors
 */
const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage: string
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error: any) {
      // Re-throw AppErrors as-is (404, 400, etc.)
      if (error instanceof AppError) {
        throw error
      }
      
      // Convert Prisma "not found" to 404
      if (error.code === 'P2025') {
        throw new AppError(404, 'Document not found')
      }
      
      // All other errors are server errors
      throw new AppError(500, errorMessage)
    }
  }) as T
}

export const documentService = {
  /**
   * Get all documents with recent changes
   */
  getAllDocuments: withErrorHandling(
    async () => {
      return await prisma.document.findMany({
        include: {
          changes: {
            orderBy: { createdAt: 'desc' },
            take: QUERY_LIMITS.RECENT_CHANGES,
          },
        },
        orderBy: { updatedAt: 'desc' },
      })
    },
    'Failed to fetch documents'
  ),

  /**
   * Get a single document by ID with all changes
   */
  getDocumentById: withErrorHandling(
    async (id: string) => {
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          changes: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!document) {
        throw new AppError(404, 'Document not found')
      }

      return document
    },
    'Failed to fetch document'
  ),

  /**
   * Create a new document
   */
  createDocument: withErrorHandling(
    async (data: CreateDocumentDto) => {
      const { content } = data
      const now = new Date()
      const etag = generateETag(content, 0, now)
      
      return await prisma.document.create({
        data: { content, etag },
      })
    },
    'Failed to create document'
  ),

  /**
   * Update a document (full replacement)
   */
  updateDocument: withErrorHandling(
    async (id: string, data: UpdateDocumentDto, expectedVersion?: number, expectedETag?: string) => {
      // Fetch current document for concurrency check
      const currentDoc = await prisma.document.findUnique({
        where: { id },
      })

      if (!currentDoc) {
        throw new AppError(404, 'Document not found')
      }

      // Check version if provided
      if (expectedVersion !== undefined && currentDoc.version !== expectedVersion) {
        throw new AppError(
          409,
          `Version conflict: expected ${expectedVersion}, current is ${currentDoc.version}`
        )
      }

      // Check ETag if provided
      if (expectedETag !== undefined && currentDoc.etag !== expectedETag) {
        throw new AppError(
          409,
          `ETag mismatch: the document has been modified by another request`
        )
      }

      // Generate new ETag
      const now = new Date()
      const newContent = data.content !== undefined ? data.content : currentDoc.content
      const newETag = generateETag(newContent, currentDoc.version, now)

      return await prisma.document.update({
        where: { id },
        data: {
          ...data,
          etag: newETag,
        },
      })
    },
    'Failed to update document'
  ),

  /**
   * Apply changes to a document (patch)
   */
  applyChangesToDocument: withErrorHandling(
    async (id: string, changes: Change[], expectedVersion?: number, expectedETag?: string) => {
      // Validate all changes
      for (const change of changes) {
        if (!isValidChange(change)) {
          throw new AppError(400, 'Invalid change format')
        }
      }

      // Fetch the current document
      const document = await prisma.document.findUnique({
        where: { id },
      })

      if (!document) {
        throw new AppError(404, 'Document not found')
      }

      // Check version if provided
      if (expectedVersion !== undefined && document.version !== expectedVersion) {
        throw new AppError(
          409,
          `Version conflict: expected ${expectedVersion}, current is ${document.version}`
        )
      }

      // Check ETag if provided
      if (expectedETag !== undefined && document.etag !== expectedETag) {
        throw new AppError(
          409,
          `ETag mismatch: the document has been modified by another request`
        )
      }

      // Apply changes to content
      const updatedContent = applyChanges(document.content, changes)

      // Generate new ETag
      const now = new Date()
      const newETag = generateETag(updatedContent, document.version, now)

      // Store changes and update document in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Store each change in the database
        await Promise.all(
          changes.map((change) =>
            tx.change.create({
              data: {
                documentId: id,
                text: change.text || '',
                operation: change.operation,
                rangeStart: change.range.start,
                rangeEnd: change.range.end,
                occurrence: change.occurrence,
                contextBefore: change.contextBefore,
                contextAfter: change.contextAfter,
              },
            })
          )
        )

        // Update the document with the new content and ETag
        return tx.document.update({
          where: { id },
          data: { 
            content: updatedContent,
            etag: newETag,
          },
          include: {
            changes: {
              orderBy: { createdAt: 'desc' },
              take: QUERY_LIMITS.RECENT_CHANGES,
            },
          },
        })
      })

      return result
    },
    'Failed to apply changes to document'
  ),

  /**
   * Delete a document
   */
  deleteDocument: withErrorHandling(
    async (id: string) => {
      await prisma.document.delete({
        where: { id },
      })
    },
    'Failed to delete document'
  ),

  /**
   * Publish a document (creates a snapshot and increments to next working version)
   */
  publishDocument: withErrorHandling(
    async (id: string) => {
      // Fetch current document to get version
      const document = await prisma.document.findUnique({
        where: { id },
      })

      if (!document) {
        throw new AppError(404, 'Document not found')
      }

      const publishedVersion = document.version
      const nextWorkingVersion = document.version + 1

      // Generate new ETag for the next working version
      const now = new Date()
      const newETag = generateETag(document.content, nextWorkingVersion, now)

      // Create version snapshot and update document in a transaction
      return await prisma.$transaction(async (tx) => {
        // Create a snapshot of the current state with its version number
        await tx.documentVersion.create({
          data: {
            documentId: id,
            version: publishedVersion,
            content: document.content,
          },
        })

        // Update document to next working version with new ETag
        return tx.document.update({
          where: { id },
          data: {
            version: nextWorkingVersion,
            etag: newETag,
          },
          include: {
            changes: {
              orderBy: { createdAt: 'desc' },
              take: QUERY_LIMITS.RECENT_CHANGES,
            },
            versions: {
              orderBy: { version: 'desc' },
              take: QUERY_LIMITS.DOCUMENT_VERSIONS,
            },
          },
        })
      })
    },
    'Failed to publish document'
  ),

  /**
   * Get all versions of a document
   */
  getDocumentVersions: withErrorHandling(
    async (id: string) => {
      const document = await prisma.document.findUnique({
        where: { id },
      })

      if (!document) {
        throw new AppError(404, 'Document not found')
      }

      return await prisma.documentVersion.findMany({
        where: { documentId: id },
        orderBy: { version: 'desc' },
      })
    },
    'Failed to fetch document versions'
  ),

  /**
   * Get a specific version of a document
   */
  getDocumentVersion: withErrorHandling(
    async (id: string, version: number) => {
      const documentVersion = await prisma.documentVersion.findUnique({
        where: {
          documentId_version: {
            documentId: id,
            version,
          },
        },
      })

      if (!documentVersion) {
        throw new AppError(404, 'Document version not found')
      }

      return documentVersion
    },
    'Failed to fetch document version'
  ),

  /**
   * Compare two versions of a document
   */
  compareDocumentVersions: withErrorHandling(
    async (id: string, version1: number, version2: number) => {
      const document = await prisma.document.findUnique({
        where: { id },
      })

      if (!document) {
        throw new AppError(404, 'Document not found')
      }

      const [v1, v2] = await Promise.all([
        prisma.documentVersion.findUnique({
          where: {
            documentId_version: {
              documentId: id,
              version: version1,
            },
          },
        }),
        prisma.documentVersion.findUnique({
          where: {
            documentId_version: {
              documentId: id,
              version: version2,
            },
          },
        }),
      ])

      if (!v1) {
        throw new AppError(404, `Version ${version1} not found`)
      }
      if (!v2) {
        throw new AppError(404, `Version ${version2} not found`)
      }

      return {
        version1: v1,
        version2: v2,
      }
    },
    'Failed to compare document versions'
  ),

  /**
   * Search documents and their versions
   */
  searchDocuments: withErrorHandling(
    async (query: string) => {
      if (!query || query.trim() === '') {
        return []
      }

      const searchQuery = query.toLowerCase()

      // Get all documents with their versions
      const documents = await prisma.document.findMany({
        include: {
          versions: {
            orderBy: { version: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      // Filter and map results
      const results = documents
        .map((doc) => {
          // Check current version (working copy)
          const currentMatches =
            doc.content.toLowerCase().includes(searchQuery)

          // Check published versions
          const matchingVersions = doc.versions
            .filter(
              (v) =>
                v.content.toLowerCase().includes(searchQuery)
            )
            .map((v) => v.version)

          // Include current version in matching versions if it matches
          const allMatchingVersions = currentMatches
            ? [doc.version, ...matchingVersions]
            : matchingVersions

          // Only include document if it has at least one matching version
          if (allMatchingVersions.length === 0) {
            return null
          }

          return {
            id: doc.id,
            content: doc.content,
            version: doc.version,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            matchingVersions: [...new Set(allMatchingVersions)].sort((a, b) => b - a),
          }
        })
        .filter((doc) => doc !== null)

      return results
    },
    'Failed to search documents'
  ),
}

