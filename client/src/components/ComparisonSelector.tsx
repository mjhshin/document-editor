import { DocumentVersion } from '../types/document'

interface ComparisonSelectorProps {
  versions: DocumentVersion[]
  selectedVersion: number | null
  compareVersion: number | null
  onCompareVersionSelect: (version: number | null) => void
}

export function ComparisonSelector({
  versions,
  selectedVersion,
  compareVersion,
  onCompareVersionSelect,
}: ComparisonSelectorProps) {
  const handleChange = (value: string) => {
    if (value === '') {
      onCompareVersionSelect(null)
    } else {
      const versionNum = parseInt(value, 10)
      onCompareVersionSelect(versionNum)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Compare With
      </label>
      <select
        value={compareVersion ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        disabled={versions.length === 0}
      >
        <option value="">No comparison</option>
        {versions.map((v) => (
          <option 
            key={v.id} 
            value={v.version}
            disabled={v.version === selectedVersion}
          >
            Version {v.version} - {new Date(v.publishedAt).toLocaleDateString()}
          </option>
        ))}
      </select>
      {compareVersion !== null && (
        <p className="mt-2 text-xs text-gray-600">
          Comparing v{selectedVersion} with v{compareVersion}
        </p>
      )}
    </div>
  )
}

