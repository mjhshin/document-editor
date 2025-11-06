import { Router } from 'express'
import { documentController } from '../controllers/documentController'

const router = Router()

// GET /api/documents/search - Search documents (must come before /:id)
router.get('/search', documentController.searchDocuments)

// GET /api/documents - Get all documents
router.get('/', documentController.getAllDocuments)

// GET /api/documents/:id - Get a specific document
router.get('/:id', documentController.getDocumentById)

// POST /api/documents - Create a new document
router.post('/', documentController.createDocument)

// PATCH /api/documents/:id - Apply changes to a document
router.patch('/:id', documentController.applyChanges)

// POST /api/documents/:id/publish - Publish a document (increments version)
router.post('/:id/publish', documentController.publishDocument)

// GET /api/documents/:id/versions - Get all versions of a document
router.get('/:id/versions', documentController.getDocumentVersions)

// GET /api/documents/:id/versions/:version - Get a specific version
router.get('/:id/versions/:version', documentController.getDocumentVersion)

// GET /api/documents/:id/versions/:v1/compare/:v2 - Compare two versions
router.get('/:id/versions/:v1/compare/:v2', documentController.compareDocumentVersions)

// DELETE /api/documents/:id - Delete a document
router.delete('/:id', documentController.deleteDocument)

export default router

