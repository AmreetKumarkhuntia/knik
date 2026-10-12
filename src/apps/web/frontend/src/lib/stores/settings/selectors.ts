import type { SettingsScope, SettingsState } from '$types/stores/settings'
export const EMPTY_SETTINGS_SCOPE: SettingsScope = {
  displayName: '',
  username: '',
  confirmClear: false,
  tab: 'general',
}
export const accountName = (
  settings: Pick<SettingsState['settings'], 'display_name' | 'username'>
) => settings.display_name || settings.username || ''
export const accountInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'
