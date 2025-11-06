import { applyChanges, isValidChange } from '../applyChanges'
import { Change } from '../../types/document'

describe('applyChanges', () => {
  describe('insert operation', () => {
    it('should insert text at the beginning', () => {
      const content = 'world'
      const changes: Change[] = [
        { operation: 'insert', range: { start: 0, end: 0 }, text: 'Hello ' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello world')
    })

    it('should insert text in the middle', () => {
      const content = 'Hello world'
      const changes: Change[] = [
        { operation: 'insert', range: { start: 6, end: 6 }, text: 'beautiful ' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello beautiful world')
    })

    it('should insert text at the end', () => {
      const content = 'Hello'
      const changes: Change[] = [
        { operation: 'insert', range: { start: 5, end: 5 }, text: ' world' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello world')
    })

    it('should insert empty string (no-op)', () => {
      const content = 'Hello world'
      const changes: Change[] = [
        { operation: 'insert', range: { start: 5, end: 5 }, text: '' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello world')
    })
  })

  describe('delete operation', () => {
    it('should delete text from the beginning', () => {
      const content = 'Hello world'
      const changes: Change[] = [
        { operation: 'delete', range: { start: 0, end: 6 }, text: '' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('world')
    })

    it('should delete text from the middle', () => {
      const content = 'Hello beautiful world'
      const changes: Change[] = [
        { operation: 'delete', range: { start: 6, end: 16 }, text: '' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello world')
    })

    it('should delete text from the end', () => {
      const content = 'Hello world'
      const changes: Change[] = [
        { operation: 'delete', range: { start: 5, end: 11 }, text: '' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello')
    })

    it('should delete all text', () => {
      const content = 'Hello world'
      const changes: Change[] = [
        { operation: 'delete', range: { start: 0, end: 11 }, text: '' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('')
    })

    it('should handle zero-length deletion (no-op)', () => {
      const content = 'Hello world'
      const changes: Change[] = [
        { operation: 'delete', range: { start: 5, end: 5 }, text: '' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello world')
    })
  })

  describe('replace operation', () => {
    it('should replace text at the beginning', () => {
      const content = 'Hello world'
      const changes: Change[] = [
        { operation: 'replace', range: { start: 0, end: 5 }, text: 'Hi' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hi world')
    })

    it('should replace text in the middle', () => {
      const content = 'Hello world'
      const changes: Change[] = [
        { operation: 'replace', range: { start: 6, end: 11 }, text: 'universe' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello universe')
    })

    it('should replace with shorter text', () => {
      const content = 'Hello beautiful world'
      const changes: Change[] = [
        { operation: 'replace', range: { start: 6, end: 15 }, text: 'nice' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello nice world')
    })

    it('should replace with longer text', () => {
      const content = 'Hello world'
      const changes: Change[] = [
        { operation: 'replace', range: { start: 6, end: 11 }, text: 'wonderful universe' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello wonderful universe')
    })

    it('should replace entire text', () => {
      const content = 'Hello world'
      const changes: Change[] = [
        { operation: 'replace', range: { start: 0, end: 11 }, text: 'New content' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('New content')
    })
  })

  describe('multiple changes', () => {
    it('should apply multiple sequential changes', () => {
      const content = 'The quick brown fox'
      const changes: Change[] = [
        { operation: 'replace', range: { start: 4, end: 9 }, text: 'slow' },
        { operation: 'insert', range: { start: 10, end: 10 }, text: 'lazy ' },
        { operation: 'delete', range: { start: 18, end: 19 }, text: '' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('The slow lazy brown fo')
    })

    it('should apply changes to build a sentence', () => {
      const content = ''
      const changes: Change[] = [
        { operation: 'insert', range: { start: 0, end: 0 }, text: 'Hello' },
        { operation: 'insert', range: { start: 5, end: 5 }, text: ' ' },
        { operation: 'insert', range: { start: 6, end: 6 }, text: 'world' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello world')
    })
  })

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const content = ''
      const changes: Change[] = [
        { operation: 'insert', range: { start: 0, end: 0 }, text: 'Hello' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello')
    })

    it('should handle no changes', () => {
      const content = 'Hello world'
      const changes: Change[] = []
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello world')
    })

    it('should handle newlines and special characters', () => {
      const content = 'Line 1\nLine 2'
      const changes: Change[] = [
        { operation: 'insert', range: { start: 6, end: 6 }, text: '\nLine 1.5' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Line 1\nLine 1.5\nLine 2')
    })

    it('should handle unicode characters', () => {
      const content = 'Hello 🌍'
      const changes: Change[] = [
        { operation: 'replace', range: { start: 6, end: 8 }, text: '🌎' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Hello 🌎')
    })

    it('should throw error for unknown operation', () => {
      const content = 'Hello world'
      const changes: any[] = [
        { operation: 'unknown', range: { start: 0, end: 5 }, text: 'Hi' },
      ]
      expect(() => applyChanges(content, changes)).toThrow('Unknown operation: unknown')
    })
  })

  describe('large text operations', () => {
    it('should handle large text insertions', () => {
      const content = 'Start'
      const largeText = 'A'.repeat(10000)
      const changes: Change[] = [
        { operation: 'insert', range: { start: 5, end: 5 }, text: largeText },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('Start' + largeText)
      expect(result.length).toBe(10005)
    })

    it('should handle large text deletions', () => {
      const largeText = 'A'.repeat(10000)
      const content = 'Start' + largeText + 'End'
      const changes: Change[] = [
        { operation: 'delete', range: { start: 5, end: 10005 }, text: '' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('StartEnd')
    })

    it('should handle large text replacements', () => {
      const content = 'A'.repeat(10000)
      const newText = 'B'.repeat(15000)
      const changes: Change[] = [
        { operation: 'replace', range: { start: 0, end: 10000 }, text: newText },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe(newText)
      expect(result.length).toBe(15000)
    })
  })
})

describe('isValidChange', () => {
  it('should validate a correct insert change', () => {
    const change = {
      operation: 'insert',
      range: { start: 0, end: 0 },
      text: 'Hello',
    }
    expect(isValidChange(change)).toBe(true)
  })

  it('should validate a correct delete change', () => {
    const change = {
      operation: 'delete',
      range: { start: 0, end: 5 },
      text: '',
    }
    expect(isValidChange(change)).toBe(true)
  })

  it('should validate a correct replace change', () => {
    const change = {
      operation: 'replace',
      range: { start: 0, end: 5 },
      text: 'Hi',
    }
    expect(isValidChange(change)).toBe(true)
  })

  it('should reject invalid operation', () => {
    const change = {
      operation: 'invalid',
      range: { start: 0, end: 5 },
      text: 'Hi',
    }
    expect(isValidChange(change)).toBe(false)
  })

  it('should reject missing required fields', () => {
    expect(isValidChange({ range: { start: 0, end: 5 }, text: 'Hi' })).toBe(false) // missing operation
    expect(isValidChange({ operation: 'insert', text: 'Hi' })).toBe(false) // missing range
    expect(isValidChange({ operation: 'insert', range: { start: 0, end: 0 } })).toBe(false) // missing text
  })

  it('should reject invalid field types', () => {
    expect(isValidChange({ operation: 'insert', range: { start: '0', end: 0 }, text: 'Hi' })).toBe(false) // invalid range.start
    expect(isValidChange({ operation: 'insert', range: { start: 0, end: '5' }, text: 'Hi' })).toBe(false) // invalid range.end
    expect(isValidChange({ operation: 'insert', range: { start: 0, end: 0 }, text: 123 })).toBe(false) // invalid text
  })

  it('should reject non-object values', () => {
    expect(isValidChange(null)).toBe(false)
    expect(isValidChange(undefined)).toBe(false)
    expect(isValidChange('not an object')).toBe(false)
  })

  it('should validate change with valid occurrence field', () => {
    const change = {
      operation: 'replace',
      range: { start: 0, end: 5 },
      text: 'Hi',
      occurrence: 2,
    }
    expect(isValidChange(change)).toBe(true)
  })

  it('should validate change with occurrence=-1 (all occurrences)', () => {
    const change = {
      operation: 'replace',
      range: { start: 0, end: 5 },
      text: 'Hi',
      occurrence: -1,
    }
    expect(isValidChange(change)).toBe(true)
  })

  it('should reject invalid occurrence (zero)', () => {
    const change = {
      operation: 'replace',
      range: { start: 0, end: 5 },
      text: 'Hi',
      occurrence: 0,
    }
    expect(isValidChange(change)).toBe(false)
  })

  it('should reject invalid occurrence (negative other than -1)', () => {
    const change = {
      operation: 'replace',
      range: { start: 0, end: 5 },
      text: 'Hi',
      occurrence: -2,
    }
    expect(isValidChange(change)).toBe(false)
  })

  it('should validate change with contextBefore', () => {
    const change = {
      operation: 'replace',
      range: { start: 0, end: 5 },
      text: 'Hi',
      contextBefore: 'prefix ',
    }
    expect(isValidChange(change)).toBe(true)
  })

  it('should validate change with contextAfter', () => {
    const change = {
      operation: 'replace',
      range: { start: 0, end: 5 },
      text: 'Hi',
      contextAfter: ' suffix',
    }
    expect(isValidChange(change)).toBe(true)
  })

  it('should validate change with both context fields', () => {
    const change = {
      operation: 'replace',
      range: { start: 0, end: 5 },
      text: 'Hi',
      contextBefore: 'prefix ',
      contextAfter: ' suffix',
    }
    expect(isValidChange(change)).toBe(true)
  })

  it('should reject invalid context field types', () => {
    expect(isValidChange({ operation: 'replace', range: { start: 0, end: 5 }, text: 'Hi', contextBefore: 123 })).toBe(false)
    expect(isValidChange({ operation: 'replace', range: { start: 0, end: 5 }, text: 'Hi', contextAfter: 123 })).toBe(false)
  })
})

describe('applyChanges with occurrence', () => {
  describe('specific occurrence', () => {
    it('should replace first occurrence when occurrence=1', () => {
      const content = 'foo bar foo baz foo'
      const changes: Change[] = [
        { operation: 'replace', range: { start: 0, end: 3 }, text: 'qux', occurrence: 1 },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('qux bar foo baz foo')
    })

    it('should replace second occurrence when occurrence=2', () => {
      const content = 'foo bar foo baz foo'
      const changes: Change[] = [
        { operation: 'replace', range: { start: 0, end: 3 }, text: 'qux', occurrence: 2 },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('foo bar qux baz foo')
    })

    it('should replace third occurrence when occurrence=3', () => {
      const content = 'foo bar foo baz foo'
      const changes: Change[] = [
        { operation: 'replace', range: { start: 0, end: 3 }, text: 'qux', occurrence: 3 },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('foo bar foo baz qux')
    })

    it('should throw error when occurrence exceeds available occurrences', () => {
      const content = 'foo bar foo'
      const changes: Change[] = [
        { operation: 'replace', range: { start: 0, end: 3 }, text: 'qux', occurrence: 5 },
      ]
      expect(() => applyChanges(content, changes)).toThrow(/Invalid occurrence/)
    })

    it('should delete specific occurrence', () => {
      const content = 'abc def abc ghi abc'
      const changes: Change[] = [
        { operation: 'delete', range: { start: 0, end: 3 }, text: '', occurrence: 2 },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('abc def  ghi abc')
    })

    it('should insert at specific occurrence position', () => {
      const content = 'x y x y x'
      const changes: Change[] = [
        { operation: 'insert', range: { start: 0, end: 1 }, text: 'NEW', occurrence: 2 },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('x y NEWx y x')
    })
  })

  describe('all occurrences (occurrence=-1)', () => {
    it('should replace all occurrences when occurrence=-1', () => {
      const content = 'foo bar foo baz foo'
      const changes: Change[] = [
        { operation: 'replace', range: { start: 0, end: 3 }, text: 'qux', occurrence: -1 },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('qux bar qux baz qux')
    })

    it('should replace only first when occurrence and context not specified', () => {
      const content = 'abc def abc ghi abc'
      const changes: Change[] = [
        { operation: 'replace', range: { start: 0, end: 3 }, text: 'xyz' },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('xyz def abc ghi abc')
    })

    it('should delete all occurrences', () => {
      const content = 'remove this and remove this and remove this'
      const changes: Change[] = [
        { operation: 'delete', range: { start: 0, end: 6 }, text: '', occurrence: -1 },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe(' this and  this and  this')
    })
  })
})

describe('applyChanges with context matching', () => {
  describe('contextBefore', () => {
    it('should match occurrence with specific contextBefore', () => {
      const content = 'hello world, hello universe'
      const changes: Change[] = [
        {
          operation: 'replace',
          range: { start: 0, end: 5 },
          text: 'goodbye',
          contextBefore: ', ',
          occurrence: 1,
        },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('hello world, goodbye universe')
    })

    it('should throw error when context does not match', () => {
      const content = 'hello world'
      const changes: Change[] = [
        {
          operation: 'replace',
          range: { start: 0, end: 5 },
          text: 'hi',
          contextBefore: 'NOT_FOUND',
        },
      ]
      expect(() => applyChanges(content, changes)).toThrow(/No matching occurrences/)
    })
  })

  describe('contextAfter', () => {
    it('should match occurrence with specific contextAfter', () => {
      const content = 'foo bar, foo baz'
      const changes: Change[] = [
        {
          operation: 'replace',
          range: { start: 0, end: 3 },
          text: 'qux',
          contextAfter: ' baz',
          occurrence: 1,
        },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('foo bar, qux baz')
    })

    it('should throw error when contextAfter does not match', () => {
      const content = 'test string'
      const changes: Change[] = [
        {
          operation: 'replace',
          range: { start: 0, end: 4 },
          text: 'new',
          contextAfter: 'INVALID',
        },
      ]
      expect(() => applyChanges(content, changes)).toThrow(/No matching occurrences/)
    })
  })

  describe('contextBefore and contextAfter together', () => {
    it('should match occurrence with both contexts', () => {
      const content = 'A test B, C test D, E test F'
      const changes: Change[] = [
        {
          operation: 'replace',
          range: { start: 2, end: 6 },
          text: 'REPLACED',
          contextBefore: 'C ',
          contextAfter: ' D',
          occurrence: 1,
        },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('A test B, C REPLACED D, E test F')
    })

    it('should replace all matches with both contexts when occurrence=-1', () => {
      const content = 'start x end, start x end, start x end'
      const changes: Change[] = [
        {
          operation: 'replace',
          range: { start: 6, end: 7 },
          text: 'Y',
          contextBefore: 'start ',
          contextAfter: ' end',
          occurrence: -1,
        },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('start Y end, start Y end, start Y end')
    })
  })

  describe('edge cases with context', () => {
    it('should handle empty contextBefore', () => {
      const content = 'abc def'
      const changes: Change[] = [
        {
          operation: 'replace',
          range: { start: 0, end: 3 },
          text: 'xyz',
          contextBefore: '',
        },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('xyz def')
    })

    it('should handle empty contextAfter', () => {
      const content = 'abc def'
      const changes: Change[] = [
        {
          operation: 'replace',
          range: { start: 0, end: 3 },
          text: 'xyz',
          contextAfter: '',
        },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('xyz def')
    })

    it('should handle context at document boundaries', () => {
      const content = 'start middle end'
      const changes: Change[] = [
        {
          operation: 'replace',
          range: { start: 13, end: 16 },
          text: 'finish',
          contextBefore: 'middle ',
          occurrence: 1,
        },
      ]
      const result = applyChanges(content, changes)
      expect(result).toBe('start middle finish')
    })
  })
})


