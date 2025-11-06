import express from 'express'
import cors from 'cors'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT || 5001

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use(routes)

// Error handling middleware (must be last)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
