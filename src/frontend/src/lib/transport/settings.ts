import type { SettingDefinition, SettingsTransport, SettingValue } from '$types/sections/settings'

/** The backend's `detail` as one line: FastAPI sends a string, or a list of validation messages. */
async function detail(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null)
  const value = body && typeof body === 'object' ? (body as { detail?: unknown }).detail : undefined
  if (typeof value === 'string') return value
  if (Array.isArray(value))
    return value
      .map(item =>
        item && typeof item === 'object' && 'msg' in item ? String(item.msg) : JSON.stringify(item)
      )
      .join('; ')
  return `${response.status} ${response.statusText}`
}

/** The only network client in the frontend; `frontend-only-io` allows `fetch` in this file alone. */
export function createSettingsTransport(): SettingsTransport {
  const base = (import.meta.env.VITE_KNIK_API_URL ?? 'http://localhost:8010').replace(/\/$/, '')
  const apiKey = import.meta.env.VITE_KNIK_API_KEY
  async function request<T>(path = '', init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${base}/api/admin/settings${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'X-API-Key': apiKey } : {}) },
    })
    if (!response.ok) {
      const message = await detail(response)
      throw new Error(
        response.status === 401
          ? `${message} Set VITE_KNIK_API_KEY to the key the backend requires.`
          : message
      )
    }
    return (await response.json()) as T
  }
  return {
    load: async () => {
      const body = await request<unknown>()
      const settings =
        body && typeof body === 'object' ? (body as { settings?: unknown }).settings : null
      if (!Array.isArray(settings)) throw new Error('Unexpected response from the settings API')
      return settings as SettingDefinition[]
    },
    save: async (changes: Record<string, SettingValue | null>) => {
      await request('', { method: 'POST', body: JSON.stringify(changes) })
    },
    reset: async (key: string) => {
      await request(`/${encodeURIComponent(key)}`, { method: 'DELETE' })
    },
  }
}
