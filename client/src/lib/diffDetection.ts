import fastDiff from 'fast-diff'
import { Change } from '../types/document'

/**
 * Detects the first change between two text strings using the fast-diff library.
 * Returns a Change object representing insert, delete, or replace operations.
 */
export function detectChange(oldText: string, newText: string): Change | null {
  if (oldText === newText) return null

  const diffs = fastDiff(oldText, newText)
  let position = 0
  let pendingDelete: { start: number; end: number } | null = null

  for (const [operation, text] of diffs) {
    if (operation === fastDiff.DELETE) {
      pendingDelete = { start: position, end: position + text.length }
      position += text.length
    } else if (operation === fastDiff.INSERT) {
      if (pendingDelete) {
        // We have both a delete and insert = replace
        return {
          operation: 'replace',
          range: pendingDelete,
          text: text,
        }
      } else {
        // Only insertion
        return {
          operation: 'insert',
          range: { start: position, end: position },
          text: text,
        }
      }
    } else if (operation === fastDiff.EQUAL) {
      if (pendingDelete) {
        // We had a delete with no following insert = deletion
        return {
          operation: 'delete',
          range: pendingDelete,
          text: '',
        }
      }
      position += text.length
    }
  }

  // Handle case where delete is the last operation
  if (pendingDelete) {
    return {
      operation: 'delete',
      range: pendingDelete,
      text: '',
    }
  }

  return null
}

