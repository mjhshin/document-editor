export interface Change {
  operation: 'replace' | 'insert' | 'delete'
  range: { start: number; end: number }
  text: string
  occurrence?: number  // Which occurrence to replace (1-based, -1 for all, null/undefined for all)
  contextBefore?: string  // Text that should appear before the match for contextual matching
  contextAfter?: string   // Text that should appear after the match for contextual matching
}

export interface CreateDocumentDto {
  content: string
}

export interface UpdateDocumentDto {
  content?: string
}

export interface ApplyChangesDto {
  changes: Change[]
  expectedVersion?: number  // Expected version for optimistic locking
  expectedETag?: string     // Expected ETag for optimistic locking
}

