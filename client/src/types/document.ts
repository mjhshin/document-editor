export interface Change {
  operation: 'replace' | 'insert' | 'delete'
  range: { start: number; end: number }
  text: string
  occurrence?: number  // Which occurrence to replace (1-based, -1 for all, null/undefined for all)
  contextBefore?: string  // Text that should appear before the match for contextual matching
  contextAfter?: string   // Text that should appear after the match for contextual matching
}

export interface BatchConfig {
  maxWaitMs: number      // Send at least every N ms
  idleWaitMs: number     // Send N ms after user stops
  maxBatchSize: number   // Send if N changes accumulated
}

export type SaveStatus = 'saved' | 'saving' | 'error'

export interface Document {
  id: string
  content: string
  version: number
  etag: string
  createdAt: string
  updatedAt: string
}

export interface DocumentVersion {
  id: string
  documentId: string
  version: number
  content: string
  publishedAt: string
}

export interface SearchResult extends Document {
  matchingVersions: number[]
}

