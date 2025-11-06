interface EmptyStateProps {
  type: 'no-documents' | 'no-search-results'
  searchQuery?: string
}

export function EmptyState({ 
  type, 
  searchQuery,
}: EmptyStateProps) {
  if (type === 'no-documents') {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600 mb-4">No documents yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <p className="text-gray-600">
        No documents found matching "{searchQuery}"
      </p>
    </div>
  )
}

