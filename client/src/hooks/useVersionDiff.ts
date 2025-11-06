import { useState, useEffect } from 'react'
import { diffWords, Change } from 'diff'
import { getDocumentVersion } from '../api/documents'

interface UseVersionDiffOptions {
  documentId: string | null
  selectedVersion: number | null
  compareVersion: number | null
}

export function useVersionDiff({
  documentId,
  selectedVersion,
  compareVersion,
}: UseVersionDiffOptions) {
  const [diffChanges, setDiffChanges] = useState<Change[]>([])

  useEffect(() => {
    if (compareVersion !== null && selectedVersion !== null && documentId) {
      loadComparison(selectedVersion, compareVersion)
    } else {
      setDiffChanges([])
    }
  }, [selectedVersion, compareVersion, documentId])

  const loadComparison = async (version1: number, version2: number) => {
    if (!documentId) return

    try {
      const [v1, v2] = await Promise.all([
        getDocumentVersion(documentId, version1),
        getDocumentVersion(documentId, version2)
      ])
      
      // Compare v2 to v1 (so added=green shows what's in selected v1, removed=red shows what was in v2)
      const changes = diffWords(v2.content, v1.content)
      setDiffChanges(changes)
    } catch (error) {
      console.error('Failed to load comparison:', error)
    }
  }

  return {
    diffChanges,
  }
}

