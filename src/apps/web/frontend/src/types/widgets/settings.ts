import type { ApiKeyInfo } from '../sections/settings'
import type { DemoVoiceOption } from '../demo-session'

export interface ProfileSummaryProps {
  displayName: string
}
export interface ToolGroupListProps {
  groups: readonly { name: string; enabled: boolean; count: number }[]
  onToggle: (name: string, enabled: boolean) => void
}
export interface VoiceOptionProps {
  voice: DemoVoiceOption
}
export interface ApiKeyRowProps {
  apiKey: ApiKeyInfo
  last: boolean
  onDelete?: () => void
}
export interface KeyRevealProps {
  value: string
  onCopy: () => void
  onDismiss: () => void
}
