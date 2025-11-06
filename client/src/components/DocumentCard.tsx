import { ChevronRight } from 'lucide-react'
import { SearchResult } from '../types/document'

interface BaseDocument {
  id: string
  content: string
  version: number
  updatedAt: string
}

interface DocumentCardProps {
  document: BaseDocument | SearchResult
  onSelect: (documentId: string) => void
}

export function DocumentCard({ document, onSelect }: DocumentCardProps) {
  const isSearchResult = 'matchingVersions' in document
  const hasMatchingVersions = isSearchResult && document.matchingVersions.length > 0

  return (
    <div
      onClick={() => onSelect(document.id)}
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-800 text-base mb-3 line-clamp-2">
            {/* Show first line of content, strip Markdown symbols for preview */}
            {document.content 
              ? document.content.split('\n')[0].replace(/[#*_\[\]()]/g, '').trim() || 'Empty document'
              : 'Empty document'}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Version {document.version}</span>
            <span>•</span>
            <span>
              Updated {new Date(document.updatedAt).toLocaleDateString()}
            </span>
          </div>
          
          {hasMatchingVersions && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-1">
                Found in versions:
              </p>
              <div className="flex flex-wrap gap-1">
                {(document as SearchResult).matchingVersions.map((version) => (
                  <span
                    key={version}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                  >
                    v{version}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="ml-4">
          <ChevronRight className="w-6 h-6 text-gray-400" />
        </div>
      </div>
    </div>
  )
}

