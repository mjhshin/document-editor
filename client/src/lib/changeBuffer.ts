import { Change, BatchConfig } from '../types/document'
import { saveDocumentChanges } from '../api/documents'

export const BATCH_CONFIG: BatchConfig = {
  maxWaitMs: 2000,
  idleWaitMs: 500,
  maxBatchSize: 100,
}

export class ChangeBuffer {
  private idleTimeoutId: NodeJS.Timeout | null = null
  private maxWaitTimeoutId: NodeJS.Timeout | null = null
  private documentId: string
  private onFlushCallback?: (success: boolean, savedContent?: string) => void
  private onConflictCallback?: () => void
  private lastSyncTime: number = Date.now()
  private hasRecentRemoteChanges: boolean = false
  private currentETag: string | null = null
  private isFlushInProgress: boolean = false
  private currentEditorContent: string = ''
  private lastSavedContent: string = ''
  private hasUnflushedChanges: boolean = false

  constructor(
    documentId: string, 
    onFlush?: (success: boolean, savedContent?: string) => void,
    onConflict?: () => void
  ) {
    this.documentId = documentId
    this.onFlushCallback = onFlush
    this.onConflictCallback = onConflict
  }
  
  /**
   * Initialize the buffer with content (call this only when first loading a document)
   */
  initializeContent(content: string) {
    this.lastSavedContent = content
    this.currentEditorContent = content
  }
  
  /**
   * Set the last saved content (call this after saving)
   * Only updates lastSavedContent, not currentEditorContent to avoid
   * overwriting user's pending edits
   */
  setLastSavedContent(content: string) {
    this.lastSavedContent = content
    // Don't update currentEditorContent - that should only be updated by user edits
    // This prevents overwriting user's pending changes when server content arrives
  }
  
  /**
   * Update the current ETag (call this when document is loaded or updated)
   */
  setETag(etag: string) {
    this.currentETag = etag
  }
  
  /**
   * Get the current ETag
   */
  getETag(): string | null {
    return this.currentETag
  }
  
  /**
   * Get time elapsed since last successful sync
   */
  getTimeSinceLastSync(): number {
    return Date.now() - this.lastSyncTime
  }
  
  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.hasUnflushedChanges ? 1 : 0
  }
  
  /**
   * Mark that remote changes were detected
   */
  setRemoteChangesDetected(detected: boolean) {
    this.hasRecentRemoteChanges = detected
  }
  
  /**
   * Check if there are recent remote changes
   */
  hasRemoteChanges(): boolean {
    return this.hasRecentRemoteChanges
  }

  addChange(_change: Change, currentContent: string) {
    // Track current editor state
    this.currentEditorContent = currentContent
    this.hasUnflushedChanges = true
    
    // If a flush is in progress, just track the content - we'll flush after
    if (this.isFlushInProgress) {
      return
    }
    
    // Clear existing idle timeout
    if (this.idleTimeoutId) {
      clearTimeout(this.idleTimeoutId)
    }
    
    // Start max wait timer if not already running
    if (!this.maxWaitTimeoutId) {
      this.maxWaitTimeoutId = setTimeout(() => {
        this.flush()
      }, BATCH_CONFIG.maxWaitMs)
    }
    
    // Schedule flush after idle period
    this.idleTimeoutId = setTimeout(() => {
      this.flush()
    }, BATCH_CONFIG.idleWaitMs)
  }

  async flush() {
    // Clear all timers
    if (this.idleTimeoutId) {
      clearTimeout(this.idleTimeoutId)
      this.idleTimeoutId = null
    }
    if (this.maxWaitTimeoutId) {
      clearTimeout(this.maxWaitTimeoutId)
      this.maxWaitTimeoutId = null
    }

    if (!this.hasUnflushedChanges) return
    
    // Calculate single change from last saved to current
    const change: Change = {
      operation: 'replace',
      range: { start: 0, end: this.lastSavedContent.length },
      text: this.currentEditorContent,
    }

    this.isFlushInProgress = true
    this.hasUnflushedChanges = false

    try {
      const updatedDoc = await saveDocumentChanges(
        this.documentId, 
        [change], 
        this.currentETag || undefined
      )
      
      // Update ETag and saved content
      this.currentETag = updatedDoc.etag
      this.lastSavedContent = updatedDoc.content
      
      this.lastSyncTime = Date.now()
      this.hasRecentRemoteChanges = false
      this.onFlushCallback?.(true, updatedDoc.content)
      
      // If more changes came in during flush, schedule another
      if (this.currentEditorContent !== updatedDoc.content) {
        this.hasUnflushedChanges = true
        this.idleTimeoutId = setTimeout(() => {
          this.flush()
        }, 100)
      }
    } catch (error: any) {
      console.error('Failed to save changes:', error)
      
      // Check if it's a conflict error (409)
      if (error.message && error.message.includes('409')) {
        console.warn('⚠️ Conflict detected')
        this.onConflictCallback?.()
        this.onFlushCallback?.(false)
      } else {
        // For other errors, mark as having unflushed changes to retry
        this.hasUnflushedChanges = true
        this.onFlushCallback?.(false)
      }
    } finally {
      this.isFlushInProgress = false
    }
  }

  // Call this when component unmounts or user navigates away
  forceFlush() {
    return this.flush()
  }

  destroy() {
    if (this.idleTimeoutId) clearTimeout(this.idleTimeoutId)
    if (this.maxWaitTimeoutId) clearTimeout(this.maxWaitTimeoutId)
  }
}

