import type { ApiKeyInfo } from '../sections/settings'
import type { DemoVoiceOption } from '../demo-session'
import type { ThemeMode } from '../theme'

export interface ProfileSummaryProps {
  displayName: string
}
export interface ThemePreviewProps {
  mode: ThemeMode
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
