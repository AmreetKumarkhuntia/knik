import type { SettingDefinition, SettingValue } from '$types/sections/settings'
import type { SettingsScope, SettingsState } from '$types/stores/settings'
export const EMPTY_SETTINGS_SCOPE: SettingsScope = {
  confirmClear: false,
  tab: 'general',
  draft: {},
  saving: false,
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

/** What a field's control shows: the draft, else the loaded value; a secret is never prefilled. */
export const fieldValue = (
  field: SettingDefinition,
  draft: SettingsScope['draft']
): string | boolean =>
  draft[field.key] ??
  (field.type === 'bool' ? field.value === true : field.secret ? '' : String(field.value ?? ''))

/** The typed value a control holds, or why its text is not one. */
export function parseField(
  field: SettingDefinition,
  raw: string | boolean
): { value: SettingValue } | { error: string } {
  if (field.type === 'bool') return { value: raw === true }
  if (field.type === 'str') return { value: String(raw) }
  const text = String(raw).trim()
  const value = Number(text)
  if (!text || Number.isNaN(value)) return { error: 'Enter a number.' }
  if (field.type === 'int' && !Number.isInteger(value)) return { error: 'Enter a whole number.' }
  return { value }
}

/** The draft's changes against the loaded values, and the fields whose text is not a value. */
export function remoteChanges(definitions: SettingDefinition[], draft: SettingsScope['draft']) {
  const changes: Record<string, SettingValue> = {},
    errors: Record<string, string> = {}
  for (const field of definitions) {
    const raw = draft[field.key]
    if (raw === undefined) continue
    const parsed = parseField(field, raw)
    if ('error' in parsed) errors[field.key] = parsed.error
    // A secret reads back masked, so typing anything into it is a change.
    else if (field.secret ? parsed.value !== '' : parsed.value !== (field.value ?? ''))
      changes[field.key] = parsed.value
  }
  return { changes, errors }
}

/** Definitions by group, in the order the backend lists them. */
export function groupDefinitions(definitions: SettingDefinition[]) {
  const groups = new Map<string, SettingDefinition[]>()
  for (const field of definitions)
    groups.set(field.group, [...(groups.get(field.group) ?? []), field])
  return [...groups]
}
