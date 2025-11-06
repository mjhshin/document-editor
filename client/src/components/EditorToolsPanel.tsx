import { FindReplacePanel } from './FindReplacePanel'
import { Change } from '../types/document'

interface EditorToolsPanelProps {
  documentContent: string
  onApplyChange: (change: Change) => void
  isEditable: boolean
}

export function EditorToolsPanel({ 
  documentContent, 
  onApplyChange, 
  isEditable 
}: EditorToolsPanelProps) {
  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Editor Tools</h2>

      <div className="space-y-6">
        {/* Find & Replace */}
        <FindReplacePanel
          documentContent={documentContent}
          onApplyChange={onApplyChange}
          disabled={!isEditable}
        />
        
        {/* Future tools can be added here:
            - Text statistics
            - Formatting tools
            - Export options
            - etc.
        */}
      </div>
      
      {/* Info message when not editable */}
      {!isEditable && (
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs text-amber-800">
            Editing tools are disabled when viewing published versions.
          </p>
        </div>
      )}
    </div>
  )
}

