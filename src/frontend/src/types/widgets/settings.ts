import type { ApiKeyInfo, SettingDefinition } from '../sections/settings'

export interface ToolGroupListProps {
  groups: readonly { name: string; enabled: boolean; count: number }[]
  onToggle: (name: string, enabled: boolean) => void
  /** `rows` sit inside a settings card; `cards` are separate bordered rows for the chat tools drawer. */
  variant?: 'rows' | 'cards'
}
/** One backend setting's row: its control follows the definition's type, options and secrecy. */
export interface SettingFieldProps {
  id: string
  field: SettingDefinition
  /** What the control shows: a boolean for a switch, text for everything else. */
  value: string | boolean
  error?: string
  last: boolean
  onChange: (value: string | boolean) => void
  /** Only a stored value can go back to its env or built-in default. */
  onReset?: () => void
}
export interface ApiKeyRowProps {
  apiKey: ApiKeyInfo
  last: boolean
  onDelete?: () => void
}
export interface SettingsWidgetProps {
  /** Pane to open, from the route's ?tab= search param. */
  requestedTab?: string | null
  /** Called once the requested pane is shown so the route can drop the param. */
  onRequestedTabApplied?: () => void
}
