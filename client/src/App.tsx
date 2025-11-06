import { useState } from 'react'
import { DocumentEditor } from './components/DocumentEditor'
import { DocumentList } from './components/DocumentList'

function App() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)

  if (selectedDocumentId) {
    return (
      <DocumentEditor
        documentId={selectedDocumentId}
        onClose={() => setSelectedDocumentId(null)}
      />
    )
  }

  return <DocumentList onSelectDocument={setSelectedDocumentId} />
}

export default App

