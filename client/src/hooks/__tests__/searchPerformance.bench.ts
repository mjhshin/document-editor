import { describe, bench } from 'vitest'

/**
 * Performance benchmarks for search indexing
 * Run with: npm test -- --run searchPerformance.bench.ts
 */

// Helper to create large documents
function createDocument(size: number): string {
  const words = ['hello', 'world', 'testing', 'performance', 'benchmark', 'search', 'index', 'optimization']
  let doc = ''
  while (doc.length < size) {
    doc += words[Math.floor(Math.random() * words.length)] + ' '
  }
  return doc
}

// Simple indexOf search (unindexed)
function unindexedSearch(content: string, term: string): number {
  let count = 0
  let position = 0
  const contentLower = content.toLowerCase()
  const termLower = term.toLowerCase()
  
  while (position < content.length) {
    const index = contentLower.indexOf(termLower, position)
    if (index === -1) break
    count++
    position = index + 1
  }
  
  return count
}

// Indexed search (simplified version)
function buildIndex(content: string): Map<string, number[]> {
  const index = new Map<string, number[]>()
  const contentLower = content.toLowerCase()
  const maxNGramLength = 10
  
  for (let i = 0; i < contentLower.length; i++) {
    for (let len = 2; len <= maxNGramLength && i + len <= contentLower.length; len++) {
      const ngram = contentLower.substring(i, i + len)
      if (!index.has(ngram)) {
        index.set(ngram, [])
      }
      index.get(ngram)!.push(i)
    }
  }
  
  return index
}

function indexedSearch(index: Map<string, number[]>, term: string): number {
  const positions = index.get(term.toLowerCase()) || []
  return positions.length
}

describe('Search Performance Benchmarks', () => {
  // Small document (< 1KB) - indexing not beneficial
  describe('Small Document (500 chars)', () => {
    const smallDoc = createDocument(500)
    
    bench('unindexed search', () => {
      unindexedSearch(smallDoc, 'test')
    })
  })

  // Medium document (5KB) - indexing starts to help
  describe('Medium Document (5KB)', () => {
    const mediumDoc = createDocument(5000)
    const index = buildIndex(mediumDoc)
    
    bench('unindexed search', () => {
      unindexedSearch(mediumDoc, 'test')
    })
    
    bench('indexed search (after build)', () => {
      indexedSearch(index, 'test')
    })
  })

  // Large document (50KB) - indexing shows significant benefit
  describe('Large Document (50KB)', () => {
    const largeDoc = createDocument(50000)
    const index = buildIndex(largeDoc)
    
    bench('unindexed search', () => {
      unindexedSearch(largeDoc, 'test')
    })
    
    bench('indexed search (after build)', () => {
      indexedSearch(index, 'test')
    })
  })

  // Very large document (100KB) - indexing essential
  describe('Very Large Document (100KB)', () => {
    const veryLargeDoc = createDocument(100000)
    const index = buildIndex(veryLargeDoc)
    
    bench('unindexed search', () => {
      unindexedSearch(veryLargeDoc, 'test')
    })
    
    bench('indexed search (after build)', () => {
      indexedSearch(index, 'test')
    })
  })

  // Index building time
  describe('Index Building', () => {
    bench('build index for 5KB document', () => {
      const doc = createDocument(5000)
      buildIndex(doc)
    })
    
    bench('build index for 50KB document', () => {
      const doc = createDocument(50000)
      buildIndex(doc)
    })
  })
})

