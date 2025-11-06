import type { SaveStatus } from '../types/document'

interface SaveStatusIndicatorProps {
  status: SaveStatus
}

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  return (
    <div className="absolute top-4 right-4 text-sm">
      {status === 'saving' && <span className="text-gray-500">Saving...</span>}
      {status === 'saved' && <span className="text-green-600">✓ Saved</span>}
      {status === 'error' && <span className="text-red-600">⚠ Error saving</span>}
    </div>
  )
}

