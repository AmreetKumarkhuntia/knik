/** Frontend session preferences the demo chat and sidebar still read. */
export interface FrontendSettings {
  model: string
  display_name: string | null
  username: string | null
}

/** A backend setting's value as JSON carries it. */
export type SettingValue = string | number | boolean

/** One user setting as `GET /api/admin/settings` lists it: its definition, the value in effect and its source. */
export interface SettingDefinition {
  key: string
  type: 'str' | 'int' | 'float' | 'bool'
  env: string
  default: SettingValue | null
  label: string
  description: string
  options: string[] | null
  secret: boolean
  group: string
  value: SettingValue | null
  source: 'db' | 'env' | 'default'
}

/** The backend settings API; the one network client of the frontend. */
export interface SettingsTransport {
  load: () => Promise<SettingDefinition[]>
  save: (changes: Record<string, SettingValue>) => Promise<void>
  reset: (key: string) => Promise<void>
}

/** An id/name option (providers, models, voices). */
export interface AdminOption {
  id: string
  name: string
}

/** A built-in MCP tool group with its function count and enabled state. */
export interface McpToolInfo {
  name: string
  category: string
  count: number
  enabled: boolean
}

/** An API key as listed (no secret). */
export interface ApiKeyInfo {
  id: string
  label: string
  key_prefix: string
  scopes: string[]
  created_at: string | null
  last_used_at: string | null
}
