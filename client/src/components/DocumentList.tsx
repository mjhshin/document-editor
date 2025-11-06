import { SearchBar } from './SearchBar'
import { DocumentCard } from './DocumentCard'
import { EmptyState } from './EmptyState'
import { useDocumentList } from '../hooks/useDocumentList'
import { useDocumentSearch } from '../hooks/useDocumentSearch'

interface DocumentListProps {
  onSelectDocument: (documentId: string) => void
}

export function DocumentList({ onSelectDocument }: DocumentListProps) {
  const { documents, isLoading, isCreating, handleCreateDocument } = useDocumentList()
  const { searchResults, isSearching, searchQuery, handleSearch } = useDocumentSearch()

  const displayDocuments = searchQuery.trim() ? searchResults : documents
  
  const createDocument = () => {
    handleCreateDocument(onSelectDocument)
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading documents...</div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <button
            onClick={createDocument}
            disabled={isCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : '+ New Document'}
          </button>
        </div>

        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search documents..."
          />
          {isSearching && (
            <p className="mt-2 text-sm text-gray-600">Searching...</p>
          )}
        </div>

        {documents.length === 0 ? (
          <EmptyState
            type="no-documents"
          />
        ) : displayDocuments.length === 0 && searchQuery.trim() ? (
          <EmptyState
            type="no-search-results"
            searchQuery={searchQuery}
          />
        ) : (
          <div className="grid gap-4">
            {displayDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onSelect={onSelectDocument}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

