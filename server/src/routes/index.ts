import { Router } from 'express'
import documentRoutes from './documentRoutes'

const router = Router()

// Document routes
router.use('/api/documents', documentRoutes)

export default router

