import { Change } from '../types/document'

/**
 * Context information used to determine the best change strategy
 */
export interface ChangeContext {
  documentContent: string
  selection: { start: number; end: number }
  isCollaborative?: boolean
  hasRecentRemoteChanges?: boolean
  queueLength?: number
  timeSinceLastSync?: number
}

/**
 * Strategy types for applying changes
 */
export type ChangeStrategy = 'range-based' | 'content-based'

/**
 * Configuration for heuristic thresholds
 */
export const STRATEGY_CONFIG = {
  // If text appears more than this many times, use content-based
  DUPLICATE_THRESHOLD: 1,
  
  // If queue has this many changes, use content-based for safety
  QUEUE_LENGTH_THRESHOLD: 3,
  
  // If more than this time since sync, positions might be stale
  STALE_POSITION_THRESHOLD_MS: 2000, // 2 seconds
  
  // Amount of context to capture (characters before/after)
  CONTEXT_LENGTH: 15,
  
  // How many chars of context to actually send
  CONTEXT_TRIM_LENGTH: 10,
}

/**
 * Counts occurrences of a text pattern in content
 */
function countOccurrences(content: string, pattern: string): number {
  if (pattern.length === 0) return 0
  
  let count = 0
  let position = 0
  
  while (position < content.length) {
    const index = content.indexOf(pattern, position)
    if (index === -1) break
    count++
    position = index + 1
  }
  
  return count
}

/**
 * Determines the optimal change strategy based on context
 * Uses automatic heuristics - no user preference override
 */
export function determineChangeStrategy(context: ChangeContext): ChangeStrategy {
  // Extract selected text
  const selectedText = context.documentContent.substring(
    context.selection.start,
    context.selection.end
  )
  
  // Heuristic 1: Empty selections always use range-based (inserts)
  if (selectedText.length === 0) {
    return 'range-based'
  }
  
  // Heuristic 2: Recent remote changes suggest positions might shift
  if (context.hasRecentRemoteChanges) {
    return 'content-based'
  }
  
  // Heuristic 3: Many queued changes = higher risk of stale positions
  if (context.queueLength && context.queueLength >= STRATEGY_CONFIG.QUEUE_LENGTH_THRESHOLD) {
    return 'content-based'
  }
  
  // Heuristic 4: Long time since sync = positions might be stale
  if (context.timeSinceLastSync && context.timeSinceLastSync >= STRATEGY_CONFIG.STALE_POSITION_THRESHOLD_MS) {
    return 'content-based'
  }
  
  // Heuristic 5: Text appears multiple times = ambiguous without context
  const occurrenceCount = countOccurrences(context.documentContent, selectedText)
  if (occurrenceCount > STRATEGY_CONFIG.DUPLICATE_THRESHOLD) {
    return 'content-based'
  }
  
  // Heuristic 6: Collaborative editing mode = play it safe
  if (context.isCollaborative) {
    return 'content-based'
  }
  
  // Default: range-based for performance
  return 'range-based'
}

/**
 * Extracts context before a position
 */
function extractContextBefore(content: string, position: number): string {
  const start = Math.max(0, position - STRATEGY_CONFIG.CONTEXT_LENGTH)
  const extracted = content.substring(start, position)
  // Return last N characters
  return extracted.slice(-STRATEGY_CONFIG.CONTEXT_TRIM_LENGTH)
}

/**
 * Extracts context after a position
 */
function extractContextAfter(content: string, position: number): string {
  const end = Math.min(content.length, position + STRATEGY_CONFIG.CONTEXT_LENGTH)
  const extracted = content.substring(position, end)
  // Return first N characters
  return extracted.slice(0, STRATEGY_CONFIG.CONTEXT_TRIM_LENGTH)
}

/**
 * Finds which occurrence number the selection represents
 */
function findOccurrenceNumber(
  content: string,
  selection: { start: number; end: number }
): number {
  const searchText = content.substring(selection.start, selection.end)
  let position = 0
  let occurrenceNum = 0
  
  while (position <= selection.start) {
    const index = content.indexOf(searchText, position)
    if (index === -1) break
    occurrenceNum++
    if (index === selection.start) {
      return occurrenceNum
    }
    position = index + 1
  }
  
  return 1 // Default to first
}

/**
 * Creates a change object using the appropriate strategy
 */
export function createSmartChange(
  operation: 'replace' | 'insert' | 'delete',
  context: ChangeContext,
  newText: string = ''
): Change {
  const strategy = determineChangeStrategy(context)
  
  if (strategy === 'content-based') {
    // Build content-based change with occurrence and context
    const occurrenceNumber = findOccurrenceNumber(
      context.documentContent,
      context.selection
    )
    
    const contextBefore = extractContextBefore(
      context.documentContent,
      context.selection.start
    )
    
    const contextAfter = extractContextAfter(
      context.documentContent,
      context.selection.end
    )
    
    return {
      operation,
      range: context.selection,
      text: newText,
      occurrence: occurrenceNumber,
      contextBefore: contextBefore || undefined,
      contextAfter: contextAfter || undefined,
    }
  }
  
  // Range-based (default)
  return {
    operation,
    range: context.selection,
    text: newText,
  }
}

/**
 * Creates a find/replace change that targets specific occurrences
 */
export function createFindReplaceChange(
  documentContent: string,
  searchText: string,
  replaceText: string,
  mode: 'first' | 'all' | number = 'first'
): Change {
  // Find first occurrence to use as sample range
  const firstIndex = documentContent.indexOf(searchText)
  
  if (firstIndex === -1) {
    throw new Error(`Text "${searchText}" not found in document`)
  }
  
  const occurrence = mode === 'all' ? -1 : mode === 'first' ? 1 : mode
  
  return {
    operation: 'replace',
    range: { start: firstIndex, end: firstIndex + searchText.length },
    text: replaceText,
    occurrence,
  }
}

/**
 * Utility to describe why a strategy was chosen (for debugging/UI)
 */
export function explainStrategy(context: ChangeContext): string {
  const strategy = determineChangeStrategy(context)
  
  const selectedText = context.documentContent.substring(
    context.selection.start,
    context.selection.end
  )
  
  if (strategy === 'content-based') {
    if (context.hasRecentRemoteChanges) {
      return 'Using content-based: Recent remote changes detected'
    }
    if (context.queueLength && context.queueLength >= STRATEGY_CONFIG.QUEUE_LENGTH_THRESHOLD) {
      return `Using content-based: ${context.queueLength} changes queued`
    }
    if (context.timeSinceLastSync && context.timeSinceLastSync >= STRATEGY_CONFIG.STALE_POSITION_THRESHOLD_MS) {
      return `Using content-based: ${Math.round(context.timeSinceLastSync / 1000)}s since last sync`
    }
    const occurrenceCount = countOccurrences(context.documentContent, selectedText)
    if (occurrenceCount > 1) {
      return `Using content-based: Text appears ${occurrenceCount} times`
    }
    if (context.isCollaborative) {
      return 'Using content-based: Collaborative editing mode'
    }
  }
  
  return 'Using range-based: Direct position edit'
}

