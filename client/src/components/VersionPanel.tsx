import { useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useVersionPanel } from '../hooks/useVersionPanel'
import { PublishButton } from './PublishButton'
import { VersionSelector } from './VersionSelector'
import { ComparisonSelector } from './ComparisonSelector'

interface VersionPanelProps {
  documentId: string
  currentVersion: number
  onVersionSelect: (version: number | null) => void
  onCompareVersionSelect: (version: number | null) => void
  onVersionUpdate: (newVersion: number) => void
  onClose: () => void
}

export function VersionPanel({ 
  documentId, 
  currentVersion,
  onVersionSelect,
  onCompareVersionSelect,
  onVersionUpdate,
  onClose
}: VersionPanelProps) {
  const {
    versions,
    selectedVersion,
    compareVersion,
    isPublishing,
    isLoading,
    error,
    setSelectedVersion,
    setCompareVersion,
    handlePublish,
  } = useVersionPanel({ documentId, currentVersion, onVersionUpdate })

  // Sync local state with parent callbacks
  useEffect(() => {
    if (selectedVersion !== null) {
      onVersionSelect(selectedVersion)
    }
  }, [selectedVersion, onVersionSelect])

  useEffect(() => {
    onCompareVersionSelect(compareVersion)
  }, [compareVersion, onCompareVersionSelect])

  const handleVersionSelectLocal = (version: number) => {
    setSelectedVersion(version)
  }

  const handleCompareSelectLocal = (version: number | null) => {
    setCompareVersion(version)
  }

  if (isLoading) {
    return (
      <div className="w-80 bg-gray-50 border-r border-gray-200 p-6">
        <button
          onClick={onClose}
          className="mb-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          title="Back to documents"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-sm text-gray-600">Loading versions...</p>
      </div>
    )
  }

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={onClose}
          className="mr-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          title="Back to documents"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">All Documents</h2>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <div className="space-y-6">
        <PublishButton onPublish={handlePublish} isPublishing={isPublishing} />
        
        <VersionSelector
          versions={versions}
          selectedVersion={selectedVersion}
          currentVersion={currentVersion}
          onVersionSelect={handleVersionSelectLocal}
        />
        
        <ComparisonSelector
          versions={versions}
          selectedVersion={selectedVersion}
          compareVersion={compareVersion}
          onCompareVersionSelect={handleCompareSelectLocal}
        />
      </div>
    </div>
  )
}

