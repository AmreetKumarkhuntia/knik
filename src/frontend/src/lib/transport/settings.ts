import type { SettingDefinition, SettingsTransport, SettingValue } from '$types/sections/settings'

const base = (import.meta.env.VITE_KNIK_API_URL ?? 'http://localhost:8010').replace(/\/$/, '')
const apiKey: string | undefined = import.meta.env.VITE_KNIK_API_KEY

async function request<T>(path = '', init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${base}/api/admin/settings${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'X-API-Key': apiKey } : {}) },
  })
  if (!response.ok) throw new Error(await detail(response))
  return (await response.json()) as T
}

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
  return {
    load: async () => (await request<{ settings: SettingDefinition[] }>()).settings,
    save: async (changes: Record<string, SettingValue>) => {
      await request('', { method: 'POST', body: JSON.stringify(changes) })
    },
    reset: async (key: string) => {
      await request(`/${encodeURIComponent(key)}`, { method: 'DELETE' })
    },
  }
}
