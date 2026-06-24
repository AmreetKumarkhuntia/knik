import type * as React from 'react'

/** A single section in the settings panel (vertical-tabs driven). */
export interface SettingsSection {
  id: string
  label: string
  icon: string
  content: React.ReactNode
}

/** Props for the settings panel. */
export interface SettingsPanelProps {
  sections?: SettingsSection[]
  className?: string
}

/** Current settings as returned by GET /api/admin/settings. */
export interface SettingsResponse {
  provider: string
  model: string
  voice: string
  temperature: number
  max_tokens: number
  sample_rate: number
  stream_responses: boolean
  send_telemetry: boolean
  display_name: string | null
  username: string | null
  initialized: boolean
}

/** Applies a partial settings patch (persists + refreshes). */
export type SettingsUpdateFn = (patch: SettingsUpdate) => Promise<void>

/** Partial settings update body for POST /api/admin/settings. */
export interface SettingsUpdate {
  provider?: string
  model?: string
  voice?: string
  api_base?: string
  api_key?: string
  temperature?: number
  max_tokens?: number
  stream_responses?: boolean
  send_telemetry?: boolean
  display_name?: string
  username?: string
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

/** Response when creating an API key — includes the full secret, shown once. */
export interface ApiKeyCreated {
  id: string
  label: string
  key_prefix: string
  scopes: string[]
  key: string
}
