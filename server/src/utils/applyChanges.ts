import { Change } from '../types/document'

/**
 * Finds all occurrences of a text in content
 * @param content - The content to search in
 * @param searchText - The text to search for
 * @param contextBefore - Optional context that should appear before the match
 * @param contextAfter - Optional context that should appear after the match
 * @returns Array of start positions where the text occurs
 */
function findOccurrences(
  content: string,
  searchText: string,
  contextBefore?: string,
  contextAfter?: string
): number[] {
  const occurrences: number[] = []
  let position = 0

  while (position < content.length) {
    const index = content.indexOf(searchText, position)
    if (index === -1) break

    // Check contextBefore if provided
    if (contextBefore !== undefined && contextBefore !== '') {
      const contextStart = Math.max(0, index - contextBefore.length)
      const actualContextBefore = content.substring(contextStart, index)
      if (!actualContextBefore.endsWith(contextBefore)) {
        position = index + 1
        continue
      }
    }

    // Check contextAfter if provided
    if (contextAfter !== undefined && contextAfter !== '') {
      const contextEnd = Math.min(content.length, index + searchText.length + contextAfter.length)
      const actualContextAfter = content.substring(index + searchText.length, contextEnd)
      if (!actualContextAfter.startsWith(contextAfter)) {
        position = index + 1
        continue
      }
    }

    occurrences.push(index)
    position = index + 1
  }

  return occurrences
}

/**
 * Applies a series of changes to a text content string
 * @param content - The original content
 * @param changes - Array of changes to apply
 * @returns The updated content after all changes are applied
 */
export function applyChanges(content: string, changes: Change[]): string {
  let updatedContent = content

  // Apply changes in order
  // Track cumulative offset as we apply changes
  let cumulativeOffset = 0

  for (const change of changes) {
    const { operation, range, text, occurrence, contextBefore, contextAfter } = change

    // Handle occurrence-based or context-based matching
    if (occurrence !== undefined || contextBefore !== undefined || contextAfter !== undefined) {
      // Get the search text from the current content at the specified range
      // Note: When using occurrence/context, the range should point to a sample of the text to find
      // We search in the CURRENT updated content, not the original
      const searchText = updatedContent.substring(
        range.start + cumulativeOffset,
        range.end + cumulativeOffset
      )
      const searchLength = searchText.length

      const occurrences = findOccurrences(
        updatedContent,
        searchText,
        contextBefore,
        contextAfter
      )

      if (occurrences.length === 0) {
        throw new Error(
          `No matching occurrences found for the specified range and context`
        )
      }

      // Determine which occurrence to use
      if (occurrence === undefined || occurrence === null || occurrence === -1) {
        // Apply to all occurrences (in reverse order to maintain indices)
        for (let i = occurrences.length - 1; i >= 0; i--) {
          const occStart = occurrences[i]
          const occEnd = occStart + searchLength
          
          updatedContent = applyOperation(
            updatedContent,
            operation,
            occStart,
            occEnd,
            text
          )
        }
        // Reset cumulative offset since we've handled all occurrences
        cumulativeOffset = 0
        continue
      } else if (occurrence > 0 && occurrence <= occurrences.length) {
        // Use specific occurrence (1-based index)
        const targetIndex = occurrence - 1
        const occStart = occurrences[targetIndex]
        const occEnd = occStart + searchLength
        
        updatedContent = applyOperation(
          updatedContent,
          operation,
          occStart,
          occEnd,
          text
        )
        // Reset cumulative offset since we used specific position
        cumulativeOffset = 0
        continue
      } else {
        throw new Error(
          `Invalid occurrence ${occurrence}. Found ${occurrences.length} occurrence(s).`
        )
      }
    }

    // No occurrence or context specified - use the range with cumulative offset
    const adjustedStart = range.start + cumulativeOffset
    const adjustedEnd = range.end + cumulativeOffset

    // Apply the operation to the content
    const lengthBefore = updatedContent.length
    updatedContent = applyOperation(updatedContent, operation, adjustedStart, adjustedEnd, text)
    const lengthAfter = updatedContent.length

    // Update cumulative offset
    cumulativeOffset += lengthAfter - lengthBefore
  }

  return updatedContent
}

/**
 * Applies a single operation to content
 * @param content - The content to modify
 * @param operation - The operation type
 * @param start - Start position
 * @param end - End position
 * @param text - Text to insert/replace
 * @returns Modified content
 */
function applyOperation(
  content: string,
  operation: string,
  start: number,
  end: number,
  text: string
): string {
  if (operation === 'replace') {
    return content.substring(0, start) + text + content.substring(end)
  } else if (operation === 'insert') {
    return content.substring(0, start) + text + content.substring(start)
  } else if (operation === 'delete') {
    return content.substring(0, start) + content.substring(end)
  } else {
    throw new Error(`Unknown operation: ${operation}`)
  }
}

/**
 * Validates a change object structure
 * @param change - The change object to validate
 * @returns true if valid, false otherwise
 */
export function isValidChange(change: any): change is Change {
  const isBasicValid =
    change &&
    typeof change === 'object' &&
    ['replace', 'insert', 'delete'].includes(change.operation) &&
    change.range &&
    typeof change.range.start === 'number' &&
    typeof change.range.end === 'number' &&
    typeof change.text === 'string'

  if (!isBasicValid) return false

  // Validate optional fields if present
  if (change.occurrence !== undefined && 
      (typeof change.occurrence !== 'number' || 
       (change.occurrence !== -1 && change.occurrence < 1))) {
    return false
  }

  if (change.contextBefore !== undefined && typeof change.contextBefore !== 'string') {
    return false
  }

  if (change.contextAfter !== undefined && typeof change.contextAfter !== 'string') {
    return false
  }

  return true
}

