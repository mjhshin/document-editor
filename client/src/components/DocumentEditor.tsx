import { useState, useEffect, useRef } from 'react'
import { useDocumentEditor } from '../hooks/useDocumentEditor'
import { useDocumentData } from '../hooks/useDocumentData'
import { useVersionDiff } from '../hooks/useVersionDiff'
import { getDocumentVersion } from '../api/documents'
import { SaveStatusIndicator } from './SaveStatusIndicator'
import { VersionPanel } from './VersionPanel'
import { EditorToolsPanel } from './EditorToolsPanel'
import { DiffView } from './DiffView'
import { MarkdownEditor } from './MarkdownEditor'
import { Change, SaveStatus } from '../types/document'
import { ChangeBuffer } from '../lib/changeBuffer'

interface DocumentEditorProps {
  documentId: string
  onClose: () => void
}

export function DocumentEditor({ documentId: propDocumentId, onClose }: DocumentEditorProps) {
  // Document data management
  const {
    documentId,
    document,
    isLoading,
    initialContent,
    publishedVersions,
    refreshDocument,
  } = useDocumentData(propDocumentId)

  // State and refs for syncing
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const changeBufferRef = useRef<ChangeBuffer | null>(null)
  const previousContentRef = useRef<string>('')

  // Initialize change buffer - only recreate when documentId changes
  const isInitializedRef = useRef(false)
  useEffect(() => {
    if (!documentId) return

    // Reset initialization flag when document changes
    isInitializedRef.current = false

    const buffer = new ChangeBuffer(
      documentId,
      (success, savedContent) => {
        setSaveStatus(success ? 'saved' : 'error')
        // Update the baseline content after successful save
        if (success && savedContent !== undefined) {
          previousContentRef.current = savedContent
        }
      },
      () => {
        // Handle conflict - refresh document to get latest version
        refreshDocument()
      }
    )
    
    changeBufferRef.current = buffer

    return () => {
      changeBufferRef.current?.forceFlush()
      changeBufferRef.current?.destroy()
    }
  }, [documentId, refreshDocument])
  
  // Initialize buffer's ETag and content when document first loads
  useEffect(() => {
    if (document && changeBufferRef.current && !isInitializedRef.current) {
      changeBufferRef.current.setETag(document.etag)
      changeBufferRef.current.initializeContent(document.content)
      isInitializedRef.current = true
    }
  }, [document])
  
  // Update only ETag and lastSavedContent when document changes (don't overwrite currentEditorContent)
  useEffect(() => {
    if (document && changeBufferRef.current && isInitializedRef.current) {
      changeBufferRef.current.setETag(document.etag)
      changeBufferRef.current.setLastSavedContent(document.content)
    }
  }, [document?.etag, document?.content])

  // Create editor with initial content
  const editor = useDocumentEditor({
    changeBufferRef,
    previousContentRef,
    onSaving: () => setSaveStatus('saving'),
    initialContent: initialContent || undefined,
  })

  // Version state management
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [compareVersion, setCompareVersion] = useState<number | null>(null)

  // Get diff changes for comparison view
  const { diffChanges } = useVersionDiff({
    documentId,
    selectedVersion,
    compareVersion,
  })

  // Computed derived state - consolidate version logic
  const isViewingPublished = selectedVersion !== null && 
                             publishedVersions.includes(selectedVersion)
  const isEditable = !isViewingPublished

  // Load version content when selected version changes
  const previousVersionRef = useRef<number | null>(null)
  useEffect(() => {
    if (selectedVersion === null || !documentId) return

    // Skip if we're selecting the same version we were already viewing
    if (selectedVersion === previousVersionRef.current) return
    previousVersionRef.current = selectedVersion

    const loadVersionContent = async () => {
      try {
        // If viewing current/latest version, use the content we already have
        // Don't reload to avoid cursor jumping
        if (selectedVersion === document?.version) {
          // Document content is already synced via the buffer system
          // No need to call editor.setContent() here
          return
        } else {
          // Load historical version
          const versionData = await getDocumentVersion(documentId, selectedVersion)
          editor.setContent(versionData.content)
        }
      } catch (error) {
        console.error('Failed to load version:', error)
      }
    }

    loadVersionContent()
  }, [selectedVersion, editor, document?.version, documentId])

  // Handle version update and refresh document
  const handleVersionUpdate = async (newVersion: number) => {
    await refreshDocument()
    setSelectedVersion(newVersion)
  }

  // Handle find/replace changes - apply them to the editor
  const handleApplyChange = (change: Change) => {
    if (!changeBufferRef.current || !editor) return
    
    // Calculate the new content after applying the find/replace
    let newContent = editor.content
    
    if (change.operation === 'replace' && change.occurrence === -1) {
      // Find and replace all occurrences
      const searchText = editor.content.substring(change.range.start, change.range.end)
      // Use split/join for compatibility
      newContent = editor.content.split(searchText).join(change.text)
    } else if (change.operation === 'replace' && change.occurrence && change.occurrence > 0) {
      // Replace specific occurrence
      const searchText = editor.content.substring(change.range.start, change.range.end)
      let position = 0
      let occurrenceNum = 0
      
      while (position < editor.content.length) {
        const index = editor.content.indexOf(searchText, position)
        if (index === -1) break
        
        occurrenceNum++
        if (occurrenceNum === change.occurrence) {
          // Replace this occurrence
          newContent = editor.content.substring(0, index) + 
                      change.text + 
                      editor.content.substring(index + searchText.length)
          break
        }
        position = index + 1
      }
    }
    
    // Update the editor content immediately
    editor.setContent(newContent)
    
    // Update the previous content ref to avoid detecting this as a manual edit
    previousContentRef.current = newContent
    
    // Add the change to the buffer with the new content
    setSaveStatus('saving')
    changeBufferRef.current.addChange(change, newContent)
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading document...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* Left Panel - Version Controls */}
      {documentId && (
        <VersionPanel
          documentId={documentId}
          currentVersion={document?.version ?? 0}
          onVersionSelect={setSelectedVersion}
          onCompareVersionSelect={setCompareVersion}
          onVersionUpdate={handleVersionUpdate}
          onClose={onClose}
        />
      )}

      {/* Main Editor Area */}
      <div className="flex-1 bg-gray-100 overflow-y-auto">
        <div className="max-w-[800px] mx-auto bg-white min-h-screen py-12 px-8 md:px-16 relative">
          <SaveStatusIndicator status={saveStatus} />
          
          {/* Read-only indicator */}
          {isViewingPublished && compareVersion === null && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800 m-0">
                Viewing published version {selectedVersion} (read-only)
              </p>
            </div>
          )}
          
          {compareVersion !== null && diffChanges.length > 0 ? (
            <DiffView changes={diffChanges} />
          ) : (
            <MarkdownEditor 
              content={editor.content}
              onChange={editor.handleChange}
              editable={isEditable}
            />
          )}
        </div>
      </div>

      {/* Right Panel - Editor Tools */}
      <EditorToolsPanel
        documentContent={editor.content}
        onApplyChange={handleApplyChange}
        isEditable={isEditable}
      />
    </div>
  )
}
