import { Change, Document, DocumentVersion, SearchResult } from '../types/document'
import { API_ENDPOINTS } from '../config/api'

/**
 * Helper function to handle API errors and log detailed information
 */
async function handleApiError(
  response: Response,
  method: string,
  url: string,
  requestBody?: any
): Promise<never> {
  let errorMessage = `HTTP ${response.status} ${response.statusText}`
  let serverError: any = null

  try {
    // Try to parse the error response body
    const errorData = await response.json()
    serverError = errorData
    if (errorData.error) {
      errorMessage = errorData.error
    }
  } catch (e) {
    // If parsing fails, use the status text
    errorMessage = response.statusText || `HTTP error ${response.status}`
  }

  // Log detailed error information to console
  console.error('❌ API Request Failed:', {
    method,
    url,
    status: response.status,
    statusText: response.statusText,
    error: errorMessage,
    serverResponse: serverError,
    requestBody: requestBody ? JSON.stringify(requestBody, null, 2) : undefined,
    timestamp: new Date().toISOString(),
  })

  throw new Error(errorMessage)
}

export async function saveDocumentChanges(
  documentId: string,
  changes: Change[],
  etag?: string
): Promise<Document> {
  const url = API_ENDPOINTS.document(documentId)
  const requestBody = { changes }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  // Include ETag for concurrency control if provided
  if (etag) {
    headers['If-Match'] = etag
  }
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    await handleApiError(response, 'PATCH', url, requestBody)
  }
  
  return await response.json()
}

export async function getDocuments(): Promise<Document[]> {
  const url = API_ENDPOINTS.documents
  const response = await fetch(url)
  
  if (!response.ok) {
    await handleApiError(response, 'GET', url)
  }

  return await response.json()
}

export async function getDocument(documentId: string): Promise<Document> {
  const url = API_ENDPOINTS.document(documentId)
  const response = await fetch(url)
  
  if (!response.ok) {
    await handleApiError(response, 'GET', url)
  }

  return await response.json()
}

export async function createDocument(content: string): Promise<Document> {
  const url = API_ENDPOINTS.documents
  const requestBody = { content }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    await handleApiError(response, 'POST', url, requestBody)
  }

  return await response.json()
}

export async function publishDocument(documentId: string): Promise<Document> {
  const url = API_ENDPOINTS.documentPublish(documentId)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    await handleApiError(response, 'POST', url)
  }

  return await response.json()
}

export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const url = API_ENDPOINTS.documentVersions(documentId)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    await handleApiError(response, 'GET', url)
  }

  return await response.json()
}

export async function getDocumentVersion(
  documentId: string, 
  version: number
): Promise<DocumentVersion> {
  const url = API_ENDPOINTS.documentVersion(documentId, version)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    await handleApiError(response, 'GET', url)
  }

  return await response.json()
}

export async function compareDocumentVersions(
  documentId: string,
  version1: number,
  version2: number
): Promise<{ version1: DocumentVersion; version2: DocumentVersion }> {
  const url = API_ENDPOINTS.documentCompare(documentId, version1, version2)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    await handleApiError(response, 'GET', url)
  }

  return await response.json()
}

export async function searchDocuments(query: string): Promise<SearchResult[]> {
  const url = `${API_ENDPOINTS.documents}/search?q=${encodeURIComponent(query)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    await handleApiError(response, 'GET', url)
  }

  return await response.json()
}

