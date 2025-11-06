import { useState, useEffect, useCallback, useRef } from 'react'

// Minimum document size to use indexing (in characters)
const INDEX_THRESHOLD = 1000

// Minimum search term length to use indexing
const MIN_SEARCH_LENGTH = 2

interface SearchResult {
  positions: number[]
  count: number
}

/**
 * Custom hook for building and querying an in-memory search index
 * Uses a simple n-gram approach for substring matching
 */
export function useSearchIndex(content: string) {
  const [isIndexing, setIsIndexing] = useState(false)
  const indexRef = useRef<Map<string, number[]> | null>(null)
  const contentRef = useRef<string>('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Build the search index
  const buildIndex = useCallback((text: string) => {
    setIsIndexing(true)
    
    // Use requestIdleCallback or setTimeout to avoid blocking
    const doIndexing = () => {
      const index = new Map<string, number[]>()
      const textLower = text.toLowerCase()
      
      // Build n-gram index for efficient substring searching
      // We'll index all substrings of length 2-5 for reasonable memory usage
      const maxNGramLength = Math.min(10, text.length)
      
      for (let i = 0; i < textLower.length; i++) {
        // Index substrings starting at position i
        for (let len = MIN_SEARCH_LENGTH; len <= maxNGramLength && i + len <= textLower.length; len++) {
          const ngram = textLower.substring(i, i + len)
          
          if (!index.has(ngram)) {
            index.set(ngram, [])
          }
          index.get(ngram)!.push(i)
        }
      }
      
      indexRef.current = index
      contentRef.current = text
      setIsIndexing(false)
    }

    // Use setTimeout to avoid blocking the UI
    setTimeout(doIndexing, 0)
  }, [])

  // Rebuild index when content changes (with debouncing)
  useEffect(() => {
    // Clear any pending index rebuild
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce index rebuilding (500ms after last content change)
    debounceTimerRef.current = setTimeout(() => {
      if (content !== contentRef.current) {
        buildIndex(content)
      }
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [content, buildIndex])

  // Search function that uses the index when available
  const search = useCallback((searchTerm: string): SearchResult => {
    if (!searchTerm) {
      return { positions: [], count: 0 }
    }

    const searchLower = searchTerm.toLowerCase()
    
    // Use index if available and search term is long enough
    if (
      indexRef.current && 
      contentRef.current === content &&
      searchTerm.length >= MIN_SEARCH_LENGTH &&
      content.length >= INDEX_THRESHOLD
    ) {
      const positions = indexRef.current.get(searchLower) || []
      return {
        positions: [...positions], // Return a copy
        count: positions.length,
      }
    }

    // Fallback to simple indexOf search for small documents or short terms
    const positions: number[] = []
    let position = 0
    const contentLower = content.toLowerCase()
    
    while (position < content.length) {
      const index = contentLower.indexOf(searchLower, position)
      if (index === -1) break
      positions.push(index)
      position = index + 1
    }
    
    return {
      positions,
      count: positions.length,
    }
  }, [content])

  return {
    search,
    isIndexing,
    isIndexed: indexRef.current !== null && contentRef.current === content,
    indexSize: indexRef.current?.size || 0,
  }
}

