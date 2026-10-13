import type { ApiKeyInfo } from '../sections/settings'
import type { DemoVoiceOption } from '../demo-session'

export interface ProfileSummaryProps {
  displayName: string
  initials: string
}
export interface ToolGroupListProps {
  groups: readonly { name: string; enabled: boolean; count: number }[]
  onToggle: (name: string, enabled: boolean) => void
}
export interface VoiceOptionProps {
  voice: DemoVoiceOption
  /** The selected voice shows a small live waveform. */
  active?: boolean
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
