import { Request, Response } from 'express'
import { documentService } from '../services/documentService'
import { asyncHandler, AppError } from '../middleware/errorHandler'

export const documentController = {
  /**
   * Get all documents
   */
  getAllDocuments: asyncHandler(async (_req: Request, res: Response) => {
    const documents = await documentService.getAllDocuments()
    res.json(documents)
  }),

  /**
   * Get document by ID
   */
  getDocumentById: asyncHandler(async (req: Request, res: Response) => {
    const document = await documentService.getDocumentById(req.params.id)
    // Set ETag header
    if (document.etag) {
      res.setHeader('ETag', document.etag)
    }
    res.json(document)
  }),

  /**
   * Create a new document
   */
  createDocument: asyncHandler(async (req: Request, res: Response) => {
    const { content } = req.body

    // Validate required fields
    if (content === undefined || typeof content !== 'string') {
      throw new AppError(400, 'Content is required and must be a string')
    }

    const document = await documentService.createDocument({ content })
    // Set ETag header
    if (document.etag) {
      res.setHeader('ETag', document.etag)
    }
    res.status(201).json(document)
  }),

  /**
   * Apply changes to a document (patch)
   */
  applyChanges: asyncHandler(async (req: Request, res: Response) => {
    const { changes, expectedVersion, expectedETag } = req.body

    if (!Array.isArray(changes)) {
      throw new AppError(400, 'Changes must be an array')
    }

    // Check If-Match header (standard HTTP header for ETags)
    const ifMatchHeader = req.headers['if-match']
    const etag = expectedETag || (ifMatchHeader as string)

    const document = await documentService.applyChangesToDocument(
      req.params.id,
      changes,
      expectedVersion,
      etag
    )
    
    // Set ETag header
    if (document.etag) {
      res.setHeader('ETag', document.etag)
    }
    res.json(document)
  }),

  /**
   * Delete a document
   */
  deleteDocument: asyncHandler(async (req: Request, res: Response) => {
    await documentService.deleteDocument(req.params.id)
    res.status(204).send()
  }),

  /**
   * Publish a document (increments version number)
   */
  publishDocument: asyncHandler(async (req: Request, res: Response) => {
    const document = await documentService.publishDocument(req.params.id)
    // Set ETag header
    if (document.etag) {
      res.setHeader('ETag', document.etag)
    }
    res.json(document)
  }),

  /**
   * Get all versions of a document
   */
  getDocumentVersions: asyncHandler(async (req: Request, res: Response) => {
    const versions = await documentService.getDocumentVersions(req.params.id)
    res.json(versions)
  }),

  /**
   * Get a specific version of a document
   */
  getDocumentVersion: asyncHandler(async (req: Request, res: Response) => {
    const version = parseInt(req.params.version, 10)
    if (isNaN(version)) {
      throw new AppError(400, 'Invalid version number')
    }
    const documentVersion = await documentService.getDocumentVersion(req.params.id, version)
    res.json(documentVersion)
  }),

  /**
   * Compare two versions of a document
   */
  compareDocumentVersions: asyncHandler(async (req: Request, res: Response) => {
    const version1 = parseInt(req.params.v1, 10)
    const version2 = parseInt(req.params.v2, 10)

    if (isNaN(version1) || isNaN(version2)) {
      throw new AppError(400, 'Invalid version numbers')
    }

    const comparison = await documentService.compareDocumentVersions(
      req.params.id,
      version1,
      version2
    )
    res.json(comparison)
  }),

  /**
   * Search documents and versions
   */
  searchDocuments: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string

    if (!query) {
      throw new AppError(400, 'Query parameter "q" is required')
    }

    const results = await documentService.searchDocuments(query)
    res.json(results)
  }),
}

