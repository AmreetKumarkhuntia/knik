import { useState, useEffect } from 'react'
import { Avatar, ActionButton, ToggleSwitch, MS } from '$components'
import { FormGroup, FormRow } from '$widgets'
import { useStore } from '$store/index'
import { ApiClient } from '$services/api'
import { SETTINGS_FIELD_STYLE } from '$lib/constants'
import type { AdminOption, SettingsPaneProps } from '$types/sections/settings'

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'AI'
  return parts
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

/** General settings: profile, defaults, and the danger zone. */
export default function GeneralPane({ settings, onUpdate }: SettingsPaneProps) {
  const handleClearHistory = useStore(s => s.handleClearHistory)
  const [models, setModels] = useState<AdminOption[]>([])

  useEffect(() => {
    void (async () => {
      try {
        setModels((await ApiClient.admin.getModels()).models)
      } catch (e) {
        console.error('Failed to load models:', e)
      }
    })()
  }, [])

  const displayName = settings?.display_name ?? ''
  const username = settings?.username ?? ''

  return (
    <>
      <FormGroup title="Profile" sub="How you appear across Knik AI">
        <div
          className="flex items-center"
          style={{
            gap: 16,
            paddingBottom: 16,
            borderBottom: '1px solid var(--border-1)',
            marginBottom: 6,
          }}
        >
          <Avatar initials={initialsFrom(displayName)} size={56} color="accent" />
          <div className="flex-1">
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-1)' }}>
              {displayName || 'Local account'}
            </div>
            <div
              className="flex items-center"
              style={{ gap: 6, fontSize: 12.5, color: 'var(--fg-4)' }}
            >
              <span
                style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }}
              />
              Local account · this device
            </div>
          </div>
        </div>
        <FormRow label="Display name">
          <input
            key={`dn-${displayName}`}
            defaultValue={displayName}
            onBlur={e => {
              if (e.target.value !== displayName) void onUpdate({ display_name: e.target.value })
            }}
            style={SETTINGS_FIELD_STYLE}
          />
        </FormRow>
        <FormRow label="Username" hint="Shown locally on this device" last>
          <input
            key={`un-${username}`}
            defaultValue={username}
            onBlur={e => {
              if (e.target.value !== username) void onUpdate({ username: e.target.value })
            }}
            style={SETTINGS_FIELD_STYLE}
          />
        </FormRow>
      </FormGroup>

      <FormGroup title="Defaults">
        <FormRow label="Default model" hint="Used for new chats">
          <select
            value={settings?.model ?? ''}
            onChange={e => void onUpdate({ model: e.target.value })}
            style={SETTINGS_FIELD_STYLE}
            disabled={!settings}
          >
            {settings && !models.some(m => m.id === settings.model) && (
              <option value={settings.model}>{settings.model}</option>
            )}
            {models.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label="Stream responses" hint="Show tokens as they generate">
          <ToggleSwitch
            checked={settings?.stream_responses ?? true}
            onChange={v => void onUpdate({ stream_responses: v })}
          />
        </FormRow>
        <FormRow label="Send telemetry" hint="Anonymous usage to improve KNIK" last>
          <ToggleSwitch
            checked={settings?.send_telemetry ?? false}
            onChange={v => void onUpdate({ send_telemetry: v })}
          />
        </FormRow>
      </FormGroup>

      <FormGroup title="Danger zone" sub="Irreversible actions">
        <FormRow label="Delete all conversations" hint="Cannot be undone" last>
          <ActionButton
            variant="danger"
            size="sm"
            icon={<MS name="delete_forever" size={15} />}
            label="Delete"
            onClick={() => void handleClearHistory()}
          />
        </FormRow>
      </FormGroup>
    </>
  )
}
