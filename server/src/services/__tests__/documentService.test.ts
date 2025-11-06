import { documentService } from '../documentService'
import { prisma } from '../../db'
import { AppError } from '../../middleware/errorHandler'

// Mock the database
jest.mock('../../db', () => ({
  prisma: {
    document: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    change: {
      create: jest.fn(),
    },
    documentVersion: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

describe('Document Service - Concurrency Control', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createDocument', () => {
    it('should create document with ETag', async () => {
      const mockDocument = {
        id: 'doc-1',
        content: 'Test content',
        version: 0,
        etag: 'generated-etag',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.document.create as jest.Mock).mockResolvedValue(mockDocument)

      const result = await documentService.createDocument({
        content: 'Test content',
      })

      expect(result).toEqual(mockDocument)
      expect(prisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          content: 'Test content',
          etag: expect.any(String),
        }),
      })
    })
  })

  describe('updateDocument - Concurrency Control', () => {
    it('should update document when version matches', async () => {
      const currentDoc = {
        id: 'doc-1',
        content: 'Original content',
        version: 0,
        etag: 'etag-v0',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedDoc = {
        ...currentDoc,
        etag: 'etag-v0-updated',
      }

      ;(prisma.document.findUnique as jest.Mock).mockResolvedValue(currentDoc)
      ;(prisma.document.update as jest.Mock).mockResolvedValue(updatedDoc)

      const result = await documentService.updateDocument(
        'doc-1',
        { content: 'Updated' },
        0, // expectedVersion
        undefined
      )

      expect(result).toEqual(updatedDoc)
    })

    it('should throw 409 error when version does not match', async () => {
      const currentDoc = {
        id: 'doc-1',
        content: 'Original content',
        version: 1, // Current version is 1
        etag: 'etag-v1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.document.findUnique as jest.Mock).mockResolvedValue(currentDoc)

      await expect(
        documentService.updateDocument(
          'doc-1',
          { content: 'Updated' },
          0, // expectedVersion is 0, but actual is 1
          undefined
        )
      ).rejects.toThrow(AppError)

      await expect(
        documentService.updateDocument('doc-1', { content: 'Updated' }, 0, undefined)
      ).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('Version conflict'),
      })
    })

    it('should update document when ETag matches', async () => {
      const currentDoc = {
        id: 'doc-1',
        content: 'Original content',
        version: 0,
        etag: 'correct-etag',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedDoc = {
        ...currentDoc,
        etag: 'new-etag',
      }

      ;(prisma.document.findUnique as jest.Mock).mockResolvedValue(currentDoc)
      ;(prisma.document.update as jest.Mock).mockResolvedValue(updatedDoc)

      const result = await documentService.updateDocument(
        'doc-1',
        { content: 'Updated' },
        undefined,
        'correct-etag' // expectedETag matches
      )

      expect(result).toEqual(updatedDoc)
    })

    it('should throw 409 error when ETag does not match', async () => {
      const currentDoc = {
        id: 'doc-1',
        content: 'Original content',
        version: 0,
        etag: 'current-etag',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.document.findUnique as jest.Mock).mockResolvedValue(currentDoc)

      await expect(
        documentService.updateDocument(
          'doc-1',
          { content: 'Updated' },
          undefined,
          'old-etag' // ETag doesn't match
        )
      ).rejects.toThrow(AppError)

      await expect(
        documentService.updateDocument('doc-1', { content: 'Updated' }, undefined, 'old-etag')
      ).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('ETag mismatch'),
      })
    })

    it('should update document when no version or ETag is provided', async () => {
      const currentDoc = {
        id: 'doc-1',
        content: 'Original content',
        version: 0,
        etag: 'etag-v0',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedDoc = {
        ...currentDoc,
        etag: 'new-etag',
      }

      ;(prisma.document.findUnique as jest.Mock).mockResolvedValue(currentDoc)
      ;(prisma.document.update as jest.Mock).mockResolvedValue(updatedDoc)

      const result = await documentService.updateDocument(
        'doc-1',
        { content: 'Updated' },
        undefined,
        undefined
      )

      expect(result).toEqual(updatedDoc)
    })
  })

  describe('applyChangesToDocument - Concurrency Control', () => {
    it('should apply changes when version matches', async () => {
      const currentDoc = {
        id: 'doc-1',
        content: 'Hello world',
        version: 0,
        etag: 'etag-v0',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const changes = [
        { operation: 'replace' as const, range: { start: 0, end: 5 }, text: 'Hi' },
      ]

      ;(prisma.document.findUnique as jest.Mock).mockResolvedValue(currentDoc)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          change: { create: jest.fn() },
          document: {
            update: jest.fn().mockResolvedValue({
              ...currentDoc,
              content: 'Hi world',
              etag: 'new-etag',
            }),
          },
        })
      })

      const result = await documentService.applyChangesToDocument(
        'doc-1',
        changes,
        0, // expectedVersion
        undefined
      )

      expect(result.content).toBe('Hi world')
    })

    it('should throw 409 error when version does not match', async () => {
      const currentDoc = {
        id: 'doc-1',
        content: 'Hello world',
        version: 1,
        etag: 'etag-v1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const changes = [
        { operation: 'replace' as const, range: { start: 0, end: 5 }, text: 'Hi' },
      ]

      ;(prisma.document.findUnique as jest.Mock).mockResolvedValue(currentDoc)

      await expect(
        documentService.applyChangesToDocument(
          'doc-1',
          changes,
          0, // expectedVersion doesn't match
          undefined
        )
      ).rejects.toThrow(AppError)

      await expect(
        documentService.applyChangesToDocument('doc-1', changes, 0, undefined)
      ).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('Version conflict'),
      })
    })

    it('should throw 409 error when ETag does not match', async () => {
      const currentDoc = {
        id: 'doc-1',
        content: 'Hello world',
        version: 0,
        etag: 'current-etag',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const changes = [
        { operation: 'replace' as const, range: { start: 0, end: 5 }, text: 'Hi' },
      ]

      ;(prisma.document.findUnique as jest.Mock).mockResolvedValue(currentDoc)

      await expect(
        documentService.applyChangesToDocument(
          'doc-1',
          changes,
          undefined,
          'old-etag' // ETag doesn't match
        )
      ).rejects.toThrow(AppError)

      await expect(
        documentService.applyChangesToDocument('doc-1', changes, undefined, 'old-etag')
      ).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('ETag mismatch'),
      })
    })

    it('should apply changes with occurrence and context fields', async () => {
      const currentDoc = {
        id: 'doc-1',
        content: 'foo bar foo baz foo',
        version: 0,
        etag: 'etag-v0',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const changes = [
        {
          operation: 'replace' as const,
          range: { start: 0, end: 3 },
          text: 'qux',
          occurrence: 2,
          contextBefore: undefined,
          contextAfter: undefined,
        },
      ]

      const mockCreate = jest.fn().mockResolvedValue({})
      const mockUpdate = jest.fn().mockResolvedValue({
        ...currentDoc,
        content: 'foo bar qux baz foo',
        etag: 'new-etag',
        changes: [],
      })
      
      ;(prisma.document.findUnique as jest.Mock).mockResolvedValue(currentDoc)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          change: { create: mockCreate },
          document: { update: mockUpdate },
        })
      })

      await documentService.applyChangesToDocument('doc-1', changes, undefined, undefined)

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          documentId: 'doc-1',
          text: 'qux',
          operation: 'replace',
          occurrence: 2,
        }),
      })
    })
  })

  describe('Concurrency Scenario Simulations', () => {
    it('should prevent lost updates with version checking', async () => {
      // Simulate two concurrent updates
      const originalDoc = {
        id: 'doc-1',
        content: 'Original content',
        version: 0,
        etag: 'etag-v0',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // First update succeeds (note: updateDocument doesn't increment version, only publish does)
      ;(prisma.document.findUnique as jest.Mock).mockResolvedValueOnce(originalDoc)
      ;(prisma.document.update as jest.Mock).mockResolvedValueOnce({
        ...originalDoc,
        version: 0,
        etag: 'etag-v0-updated',
      })

      await documentService.updateDocument('doc-1', { content: 'Update 1' }, 0, undefined)

      // Second update - meanwhile another user modified the document (changed the ETag)
      // Since we're using version checking, we need a different version
      ;(prisma.document.findUnique as jest.Mock).mockResolvedValueOnce({
        ...originalDoc,
        version: 1, // Version changed by another operation
        etag: 'etag-v1',
      })

      await expect(
        documentService.updateDocument(
          'doc-1',
          { content: 'Update 2' },
          0, // Using stale version
          undefined
        )
      ).rejects.toMatchObject({
        statusCode: 409,
      })
    })

    it('should prevent lost updates with ETag checking', async () => {
      const originalDoc = {
        id: 'doc-1',
        content: 'Original content',
        version: 0,
        etag: 'original-etag',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // First update succeeds and changes ETag
      ;(prisma.document.findUnique as jest.Mock).mockResolvedValueOnce(originalDoc)
      ;(prisma.document.update as jest.Mock).mockResolvedValueOnce({
        ...originalDoc,
        etag: 'new-etag-1',
      })

      await documentService.updateDocument('doc-1', { content: 'Update 1' }, undefined, 'original-etag')

      // Second update with stale ETag should fail
      ;(prisma.document.findUnique as jest.Mock).mockResolvedValueOnce({
        ...originalDoc,
        etag: 'new-etag-1', // ETag already changed
      })

      await expect(
        documentService.updateDocument(
          'doc-1',
          { content: 'Update 2' },
          undefined,
          'original-etag' // Using stale ETag
        )
      ).rejects.toMatchObject({
        statusCode: 409,
      })
    })
  })
})

