import { useState } from 'react'
import { searchDocuments } from '../api/documents'
import { SearchResult } from '../types/document'

export function useDocumentSearch() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    try {
      setIsSearching(true)
      const results = await searchDocuments(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Failed to search documents:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return {
    searchResults,
    isSearching,
    searchQuery,
    handleSearch,
  }
}

