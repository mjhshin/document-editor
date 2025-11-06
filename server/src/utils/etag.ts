import crypto from 'crypto'

/**
 * Generates an ETag for a document
 * ETag is a hash of the content, version, and last updated timestamp
 * @param content - The document content
 * @param version - The document version
 * @param updatedAt - The last updated timestamp
 * @returns An ETag string
 */
export function generateETag(content: string, version: number, updatedAt: Date): string {
  const data = `${content}:${version}:${updatedAt.toISOString()}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
}

/**
 * Checks if a provided ETag matches the current document state
 * @param providedETag - The ETag provided by the client
 * @param currentETag - The current ETag of the document
 * @returns true if they match, false otherwise
 */
export function validateETag(providedETag: string, currentETag: string): boolean {
  return providedETag === currentETag
}

