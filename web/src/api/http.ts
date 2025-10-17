const base = import.meta.env.VITE_API_URL as string

export function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...Object.fromEntries(new Headers(init.headers || {})),
    ...authHeader()
  }

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: mergedHeaders
  })

  if (!res.ok) throw new Error(`${res.status}`)

  if (res.status === 204) return undefined as T

  const text = await res.text()
  if (!text) return undefined as T

  return JSON.parse(text) as T
}
