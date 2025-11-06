import { useState, useEffect } from 'react'
import { getDocuments, createDocument } from '../api/documents'
import { Document } from '../types/document'

export function useDocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setIsLoading(true)
      const docs = await getDocuments()
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDocument = async (onSuccess: (documentId: string) => void) => {
    try {
      setIsCreating(true)
      const newDoc = await createDocument('')
      onSuccess(newDoc.id)
    } catch (error) {
      console.error('Failed to create document:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return {
    documents,
    isLoading,
    isCreating,
    handleCreateDocument,
  }
}

