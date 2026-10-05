/**
 * API client helper with automatic JWT token management and authentication headers
 */

export const TOKEN_KEY = 'sute_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {}
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

export function authHeaders(customHeaders?: HeadersInit): HeadersInit {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((value, key) => {
        headers[key] = value
      })
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, value]) => {
        headers[key] = value
      })
    } else {
      Object.assign(headers, customHeaders)
    }
  }
  return headers
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers = new Headers(init.headers || {})
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(input, {
    ...init,
    headers
  })

  // Handle unauthorized responses (session expired or invalid token)
  if (response.status === 401) {
    console.warn('[API] 401 Unauthorized encountered from:', input)
  }

  return response
}
