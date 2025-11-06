import { renderHook, waitFor } from '@testing-library/react'
import { useSearchIndex } from '../useSearchIndex'

describe('useSearchIndex', () => {
  it('should search in small documents without indexing', () => {
    const content = 'Hello world, hello universe'
    const { result } = renderHook(() => useSearchIndex(content))

    const searchResult = result.current.search('hello')
    
    expect(searchResult.count).toBe(2)
    expect(searchResult.positions).toHaveLength(2)
    expect(result.current.isIndexed).toBe(false)
  })

  it('should build index for large documents', async () => {
    // Create a document larger than INDEX_THRESHOLD (1000 chars)
    const content = 'test '.repeat(300) // 1500 characters
    const { result } = renderHook(() => useSearchIndex(content))

    // Wait for index to be built
    await waitFor(() => {
      expect(result.current.isIndexed).toBe(true)
    }, { timeout: 2000 })

    expect(result.current.indexSize).toBeGreaterThan(0)
  })

  it('should find all occurrences using the index', async () => {
    const content = 'foo bar foo baz foo'.repeat(100) // Large document
    const { result } = renderHook(() => useSearchIndex(content))

    // Wait for index to be built
    await waitFor(() => {
      expect(result.current.isIndexed).toBe(true)
    })

    const searchResult = result.current.search('foo')
    
    expect(searchResult.count).toBe(300) // 3 occurrences * 100 repetitions
    expect(searchResult.positions).toHaveLength(300)
  })

  it('should handle case-insensitive search', async () => {
    const content = 'Hello HELLO hElLo'.repeat(100)
    const { result } = renderHook(() => useSearchIndex(content))

    await waitFor(() => {
      expect(result.current.isIndexed).toBe(true)
    })

    const searchResult = result.current.search('hello')
    
    expect(searchResult.count).toBe(300) // All 3 variations * 100
  })

  it('should return empty results for non-existent terms', () => {
    const content = 'Hello world'
    const { result } = renderHook(() => useSearchIndex(content))

    const searchResult = result.current.search('xyz')
    
    expect(searchResult.count).toBe(0)
    expect(searchResult.positions).toHaveLength(0)
  })

  it('should handle empty search term', () => {
    const content = 'Hello world'
    const { result } = renderHook(() => useSearchIndex(content))

    const searchResult = result.current.search('')
    
    expect(searchResult.count).toBe(0)
    expect(searchResult.positions).toHaveLength(0)
  })

  it('should rebuild index when content changes', async () => {
    const { result, rerender } = renderHook(
      ({ content }) => useSearchIndex(content),
      { initialProps: { content: 'test '.repeat(300) } }
    )

    // Wait for initial index
    await waitFor(() => {
      expect(result.current.isIndexed).toBe(true)
    })

    const initialIndexSize = result.current.indexSize

    // Change content
    rerender({ content: 'different content '.repeat(300) })

    // Wait for reindex
    await waitFor(() => {
      expect(result.current.isIndexed).toBe(true)
    }, { timeout: 2000 })

    // Index should be rebuilt with different size
    expect(result.current.indexSize).not.toBe(initialIndexSize)
  })

  it('should find substring matches', async () => {
    const content = 'JavaScript TypeScript CoffeeScript'.repeat(100)
    const { result } = renderHook(() => useSearchIndex(content))

    await waitFor(() => {
      expect(result.current.isIndexed).toBe(true)
    })

    const searchResult = result.current.search('Script')
    
    // Should match all three: JavaScript, TypeScript, CoffeeScript
    expect(searchResult.count).toBe(300) // 3 * 100
  })

  it('should maintain correct positions', () => {
    const content = 'foo bar foo'
    const { result } = renderHook(() => useSearchIndex(content))

    const searchResult = result.current.search('foo')
    
    expect(searchResult.positions).toEqual([0, 8])
    // Verify positions are correct
    expect(content.substring(searchResult.positions[0], searchResult.positions[0] + 3)).toBe('foo')
    expect(content.substring(searchResult.positions[1], searchResult.positions[1] + 3)).toBe('foo')
  })
})

