/** Editable frontend session preferences. */
export interface FrontendSettings {
  provider: string
  model: string
  voice: string
  temperature: number
  max_tokens: number
  sample_rate: number
  tts_enabled: boolean
  speaking_rate: number
  stream_responses: boolean
  send_telemetry: boolean
  display_name: string | null
  username: string | null
  initialized: boolean
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

/** A supplied demo key scenario, including its displayable sample secret. */
export interface ApiKeyCreated {
  id: string
  label: string
  key_prefix: string
  scopes: string[]
  key: string
}
