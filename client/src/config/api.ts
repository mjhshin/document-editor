const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export const API_ENDPOINTS = {
  documents: `${API_BASE_URL}/api/documents`,
  document: (id: string) => `${API_BASE_URL}/api/documents/${id}`,
  documentPublish: (id: string) => `${API_BASE_URL}/api/documents/${id}/publish`,
  documentVersions: (id: string) => `${API_BASE_URL}/api/documents/${id}/versions`,
  documentVersion: (id: string, version: number) => 
    `${API_BASE_URL}/api/documents/${id}/versions/${version}`,
  documentCompare: (id: string, version1: number, version2: number) => 
    `${API_BASE_URL}/api/documents/${id}/versions/${version1}/compare/${version2}`,
}

