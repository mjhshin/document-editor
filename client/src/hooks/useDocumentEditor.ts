import { useState, useEffect, useRef } from 'react'
import { detectChange } from '../lib/diffDetection'
import { createSmartChange, ChangeContext } from '../lib/changeStrategy'
import type { ChangeBuffer } from '../lib/changeBuffer'
import type { MutableRefObject } from 'react'

interface UseDocumentEditorOptions {
  changeBufferRef: MutableRefObject<ChangeBuffer | null>
  previousContentRef: MutableRefObject<string>
  onSaving: () => void
  initialContent?: string
  isCollaborative?: boolean
}

export function useDocumentEditor({
  changeBufferRef,
  previousContentRef,
  onSaving,
  initialContent,
  isCollaborative = false,
}: UseDocumentEditorOptions) {
  const [content, setContent] = useState(initialContent || '')
  const isInitializedRef = useRef(false)

  // Initialize with content
  useEffect(() => {
    setContent(initialContent || '')
    previousContentRef.current = initialContent || ''
    isInitializedRef.current = true
  }, [initialContent, previousContentRef])

  const handleChange = (newContent: string) => {
    setContent(newContent)

    // Don't process updates until initialized
    if (!isInitializedRef.current) return
    if (!changeBufferRef.current) return

    const oldContent = previousContentRef.current

    // Skip if content hasn't actually changed
    if (newContent === oldContent) return

    const basicChange = detectChange(oldContent, newContent)
    
    if (basicChange) {
      // Build context for smart strategy detection
      const context: ChangeContext = {
        documentContent: oldContent,
        selection: basicChange.range,
        isCollaborative,
        hasRecentRemoteChanges: changeBufferRef.current.hasRemoteChanges(),
        queueLength: changeBufferRef.current.getQueueLength(),
        timeSinceLastSync: changeBufferRef.current.getTimeSinceLastSync(),
      }
      
      // Create smart change with appropriate strategy
      const smartChange = createSmartChange(
        basicChange.operation,
        context,
        basicChange.text
      )
      
      onSaving()
      changeBufferRef.current.addChange(smartChange, newContent)
    }

    previousContentRef.current = newContent
  }

  return {
    content,
    setContent,
    handleChange,
  }
}

