import { useState, useEffect, useCallback } from 'react'
import { getDocument, getDocumentVersions } from '../api/documents'
import { Document } from '../types/document'

export function useDocumentData(documentId: string) {
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialContent, setInitialContent] = useState<string | null>(null)
  const [publishedVersions, setPublishedVersions] = useState<number[]>([])

  // Fetch document and published versions when documentId changes
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setIsLoading(true)
        const data = await getDocument(documentId)
        setDocument(data)
        
        // Set initial content - this will trigger editor recreation when documentId changes
        setInitialContent(data.content)

        // Fetch published versions to determine which are read-only
        const versions = await getDocumentVersions(documentId)
        setPublishedVersions(versions.map(v => v.version))
      } catch (error) {
        console.error('Failed to fetch document:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocument()
  }, [documentId])

  const refreshDocument = useCallback(async () => {
    if (!documentId) return

    try {
      const data = await getDocument(documentId)
      setDocument(data)
      
      // Refresh published versions list
      const versions = await getDocumentVersions(documentId)
      setPublishedVersions(versions.map(v => v.version))
    } catch (error) {
      console.error('Failed to refresh document:', error)
    }
  }, [documentId])

  return {
    documentId,
    document,
    isLoading,
    initialContent,
    publishedVersions,
    refreshDocument,
  }
}

