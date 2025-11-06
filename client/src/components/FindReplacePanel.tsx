import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { createFindReplaceChange } from '../lib/changeStrategy'
import { Change } from '../types/document'
import { useSearchIndex } from '../hooks/useSearchIndex'

interface FindReplacePanelProps {
  documentContent: string
  onApplyChange: (change: Change) => void
  disabled?: boolean
}

export function FindReplacePanel({ 
  documentContent, 
  onApplyChange, 
  disabled = false 
}: FindReplacePanelProps) {
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [matchCount, setMatchCount] = useState(0)
  const [isReplacing, setIsReplacing] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  // Use the search index hook for fast searching
  const { search, isIndexing, isIndexed } = useSearchIndex(documentContent)

  // Count matches whenever findText changes using the index
  useEffect(() => {
    if (!findText) {
      setMatchCount(0)
      return
    }

    const result = search(findText)
    setMatchCount(result.count)
  }, [findText, search])

  const handleReplaceAll = async () => {
    if (!findText || isReplacing) return
    
    setIsReplacing(true)
    setLastError(null)
    
    try {
      // Create a find/replace change with occurrence: -1 (all)
      const change = createFindReplaceChange(
        documentContent,
        findText,
        replaceText,
        'all'
      )
      
      // Apply the change
      onApplyChange(change)
      
      // Clear inputs after successful replace
      setFindText('')
      setReplaceText('')
    } catch (error) {
      console.error('Replace all failed:', error)
      setLastError(error instanceof Error ? error.message : 'Replace failed')
    } finally {
      setIsReplacing(false)
    }
  }

  const canReplace = findText && matchCount > 0 && !disabled && !isReplacing

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
        <Search className="w-4 h-4 mr-2" />
        Find & Replace
      </h3>

      <div className="space-y-3">
        {/* Find Input */}
        <div>
          <label htmlFor="find-input" className="block text-xs font-medium text-gray-700 mb-1">
            Find
          </label>
          <input
            id="find-input"
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Search text..."
            disabled={disabled}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {findText && (
            <p className="mt-1 text-xs text-gray-600">
              {matchCount === 0 ? (
                <span className="text-amber-600">No matches found</span>
              ) : (
                <span className="text-green-600">
                  {matchCount} match{matchCount !== 1 ? 'es' : ''} found
                </span>
              )}
            </p>
          )}
          {isIndexing && (
            <p className="mt-1 text-xs text-gray-500">Building search index...</p>
          )}
        </div>

        {/* Replace Input */}
        <div>
          <label htmlFor="replace-input" className="block text-xs font-medium text-gray-700 mb-1">
            Replace with
          </label>
          <input
            id="replace-input"
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replacement text..."
            disabled={disabled}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Error Message */}
        {lastError && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-700">{lastError}</p>
          </div>
        )}

        {/* Replace All Button */}
        <button
          onClick={handleReplaceAll}
          disabled={!canReplace}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isReplacing ? 'Replacing...' : `Replace All (${matchCount})`}
        </button>

        <p className="text-xs text-gray-500">
          This will replace all {matchCount} occurrence{matchCount !== 1 ? 's' : ''} at once.
        </p>
      </div>
    </div>
  )
}

