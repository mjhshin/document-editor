import { useState, useEffect } from 'react'
import { publishDocument, getDocumentVersions } from '../api/documents'
import { DocumentVersion } from '../types/document'

interface UseVersionPanelOptions {
  documentId: string
  currentVersion: number
  onVersionUpdate: (newVersion: number) => void
}

export function useVersionPanel({
  documentId,
  currentVersion,
  onVersionUpdate,
}: UseVersionPanelOptions) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [compareVersion, setCompareVersion] = useState<number | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadVersions()
  }, [documentId])

  useEffect(() => {
    // Default to working version (current)
    if (versions.length > 0 && selectedVersion === null) {
      setSelectedVersion(currentVersion)
    }
  }, [versions, currentVersion, selectedVersion])

  const loadVersions = async () => {
    try {
      setIsLoading(true)
      const data = await getDocumentVersions(documentId)
      setVersions(data)
    } catch (err) {
      console.error('Failed to load versions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async () => {
    try {
      setIsPublishing(true)
      setError(null)
      const updatedDocument = await publishDocument(documentId)
      onVersionUpdate(updatedDocument.version)
      await loadVersions()
      setSelectedVersion(updatedDocument.version)
    } catch (err) {
      setError('Failed to publish document')
      console.error('Publish error:', err)
    } finally {
      setIsPublishing(false)
    }
  }

  return {
    versions,
    selectedVersion,
    compareVersion,
    isPublishing,
    isLoading,
    error,
    setSelectedVersion,
    setCompareVersion,
    handlePublish,
  }
}

