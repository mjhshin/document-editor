import { DocumentVersion } from '../types/document'

interface VersionSelectorProps {
  versions: DocumentVersion[]
  selectedVersion: number | null
  currentVersion: number
  onVersionSelect: (version: number) => void
}

export function VersionSelector({
  versions,
  selectedVersion,
  currentVersion,
  onVersionSelect,
}: VersionSelectorProps) {
  const handleChange = (value: string) => {
    const versionNum = value === 'latest' ? currentVersion : parseInt(value, 10)
    onVersionSelect(versionNum)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        View Version
      </label>
      <select
        value={selectedVersion === currentVersion ? 'latest' : selectedVersion ?? 'latest'}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
      >
        <option value="latest">Working Version</option>
        {versions.map((v) => (
          <option key={v.id} value={v.version}>
            Version {v.version} - {new Date(v.publishedAt).toLocaleDateString()}
          </option>
        ))}
      </select>
    </div>
  )
}

