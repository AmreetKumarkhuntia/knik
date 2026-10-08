import type { SettingsScope } from '$types/stores/settings'
export const EMPTY_SETTINGS_SCOPE: SettingsScope = {
  displayName: '',
  username: '',
  confirmClear: false,
  tab: 'general',
  playing: false,
}
export const accountInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'
