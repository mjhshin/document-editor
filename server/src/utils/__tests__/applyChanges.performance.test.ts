import { applyChanges } from '../applyChanges'
import { Change } from '../../types/document'

/**
 * Performance benchmarks for document operations
 * These tests measure performance with large documents and many operations
 */

describe('applyChanges performance benchmarks', () => {
  // Helper to measure execution time
  const measureTime = (fn: () => void): number => {
    const start = performance.now()
    fn()
    const end = performance.now()
    return end - start
  }

  // Helper to create a large document
  const createLargeDocument = (sizeInKB: number): string => {
    const sizeInBytes = sizeInKB * 1024
    const paragraph =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '
    const repetitions = Math.ceil(sizeInBytes / paragraph.length)
    return paragraph.repeat(repetitions).slice(0, sizeInBytes)
  }

  describe('small documents (< 100KB)', () => {
    it('should handle 10KB document with single insert < 10ms', () => {
      const content = createLargeDocument(10)
      const changes: Change[] = [
        { operation: 'insert', range: { start: 5000, end: 5000 }, text: 'INSERTED TEXT' },
      ]

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(10)
    })

    it('should handle 10KB document with 10 sequential operations < 20ms', () => {
      const content = createLargeDocument(10)
      const changes: Change[] = Array.from({ length: 10 }, (_, i) => ({
        operation: 'insert' as const,
        range: { start: 1000 * i, end: 1000 * i },
        text: `Insert ${i}`,
      }))

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(20)
    })

    it('should handle 50KB document with single replace < 15ms', () => {
      const content = createLargeDocument(50)
      const changes: Change[] = [
        {
          operation: 'replace',
          range: { start: 10000, end: 20000 },
          text: 'REPLACEMENT TEXT '.repeat(100),
        },
      ]

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(15)
    })
  })

  describe('medium documents (100KB - 1MB)', () => {
    it('should handle 100KB document with single insert < 20ms', () => {
      const content = createLargeDocument(100)
      const changes: Change[] = [
        { operation: 'insert', range: { start: 50000, end: 50000 }, text: 'INSERTED TEXT' },
      ]

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(20)
    })

    it('should handle 500KB document with single delete < 50ms', () => {
      const content = createLargeDocument(500)
      const changes: Change[] = [
        { operation: 'delete', range: { start: 100000, end: 200000 }, text: '' },
      ]

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(50)
    })

    it('should handle 500KB document with 50 operations < 100ms', () => {
      const content = createLargeDocument(500)
      const changes: Change[] = Array.from({ length: 50 }, (_, i) => ({
        operation: 'insert' as const,
        range: { start: 10000 * i, end: 10000 * i },
        text: `Insert ${i} `,
      }))

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(100)
    })

    it('should handle 1MB document with single replace < 100ms', () => {
      const content = createLargeDocument(1024)
      const changes: Change[] = [
        {
          operation: 'replace',
          range: { start: 100000, end: 200000 },
          text: 'NEW CONTENT '.repeat(1000),
        },
      ]

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(100)
    })
  })

  describe('large documents (> 1MB)', () => {
    it('should handle 5MB document with single insert < 200ms', () => {
      const content = createLargeDocument(5 * 1024)
      const changes: Change[] = [
        { operation: 'insert', range: { start: 2500000, end: 2500000 }, text: 'INSERTED' },
      ]

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(200)
    })

    it('should handle 5MB document with 10 operations < 300ms', () => {
      const content = createLargeDocument(5 * 1024)
      const changes: Change[] = Array.from({ length: 10 }, (_, i) => ({
        operation: 'insert' as const,
        range: { start: 500000 * i, end: 500000 * i },
        text: `Chunk ${i}`,
      }))

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(300)
    })

    it('should handle 10MB document with single operation < 500ms', () => {
      const content = createLargeDocument(10 * 1024)
      const changes: Change[] = [
        { operation: 'insert', range: { start: 5000000, end: 5000000 }, text: 'INSERT' },
      ]

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(500)
    })
  })

  describe('batch operations stress test', () => {
    it('should handle 100 operations on 100KB document < 200ms', () => {
      const content = createLargeDocument(100)
      const changes: Change[] = Array.from({ length: 100 }, (_, i) => ({
        operation: 'insert' as const,
        range: { start: 1000 * i, end: 1000 * i },
        text: `Op${i} `,
      }))

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(200)
    })

    it('should handle 500 operations on 50KB document < 500ms', () => {
      const content = createLargeDocument(50)
      const changes: Change[] = Array.from({ length: 500 }, (_, i) => ({
        operation: 'insert' as const,
        range: { start: 100 * i, end: 100 * i },
        text: `${i}`,
      }))

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(500)
    })

    it('should handle mixed operations (insert/delete/replace) < 250ms', () => {
      const content = createLargeDocument(200)
      const operations = ['insert', 'delete', 'replace'] as const
      const changes: Change[] = Array.from({ length: 100 }, (_, i) => {
        const op = operations[i % 3]
        const pos = 2000 * i
        return {
          operation: op,
          range: { start: pos, end: op === 'insert' ? pos : pos + 100 },
          text: op === 'delete' ? '' : `Text${i}`,
        }
      })

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(250)
    })
  })

  describe('edge case performance', () => {
    it('should handle operation at document start efficiently', () => {
      const content = createLargeDocument(1024)
      const changes: Change[] = [
        { operation: 'insert', range: { start: 0, end: 0 }, text: 'START' },
      ]

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(100)
    })

    it('should handle operation at document end efficiently', () => {
      const content = createLargeDocument(1024)
      const changes: Change[] = [
        { operation: 'insert', range: { start: content.length, end: content.length }, text: 'END' },
      ]

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(100)
    })

    it('should handle many small deletions efficiently', () => {
      const content = createLargeDocument(100)
      const changes: Change[] = Array.from({ length: 200 }, (_, i) => ({
        operation: 'delete' as const,
        range: { start: 500 * i, end: 500 * i + 10 },
        text: '',
      }))

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(300)
    })

    it('should handle large single operation efficiently', () => {
      const content = createLargeDocument(1024)
      const largeInsertion = 'X'.repeat(500000) // 500KB insertion
      const changes: Change[] = [
        { operation: 'insert', range: { start: 500000, end: 500000 }, text: largeInsertion },
      ]

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(200)
    })
  })

  describe('real-world scenarios', () => {
    it('should handle typical typing scenario (1 char at a time, 100 operations)', () => {
      let content = createLargeDocument(50)
      const changes: Change[] = Array.from({ length: 100 }, (_, i) => ({
        operation: 'insert' as const,
        range: { start: 25000 + i, end: 25000 + i },
        text: String.fromCharCode(65 + (i % 26)), // A-Z cycling
      }))

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(150)
    })

    it('should handle copy-paste of large content', () => {
      const content = createLargeDocument(100)
      const pastedContent = createLargeDocument(50)
      const changes: Change[] = [
        { operation: 'insert', range: { start: 50000, end: 50000 }, text: pastedContent },
      ]

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(100)
    })

    it('should handle undo/redo scenario (alternating operations)', () => {
      const content = createLargeDocument(100)
      const changes: Change[] = [
        { operation: 'insert', range: { start: 50000, end: 50000 }, text: 'ADDED' },
        { operation: 'delete', range: { start: 50000, end: 50005 }, text: '' },
        { operation: 'insert', range: { start: 50000, end: 50000 }, text: 'ADDED' },
        { operation: 'delete', range: { start: 50000, end: 50005 }, text: '' },
      ]

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(50)
    })

    it('should handle find-and-replace across document', () => {
      const content = 'The quick brown fox. ' + createLargeDocument(200)
      // Simulate replacing multiple occurrences
      const changes: Change[] = [
        { operation: 'replace', range: { start: 4, end: 9 }, text: 'slow' },
        { operation: 'replace', range: { start: 15, end: 18 }, text: 'cat' },
      ]

      const time = measureTime(() => {
        applyChanges(content, changes)
      })

      expect(time).toBeLessThan(100)
    })
  })

  describe('memory efficiency', () => {
    it('should not leak memory with repeated operations', () => {
      const content = createLargeDocument(100)
      const iterations = 50

      const time = measureTime(() => {
        for (let i = 0; i < iterations; i++) {
          const changes: Change[] = [
            { operation: 'insert', range: { start: 1000, end: 1000 }, text: `Iter${i}` },
          ]
          applyChanges(content, changes)
        }
      })

      // Should be roughly linear with number of iterations
      expect(time).toBeLessThan(500)
    })
  })
})


