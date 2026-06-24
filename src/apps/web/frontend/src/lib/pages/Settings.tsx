import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import VerticalTabs from '$components/VerticalTabs'
import ActionButton from '$components/ActionButton'
import ActionIcon from '$components/ActionIcon'
import Avatar from '$components/Avatar'
import Chip from '$components/Chip'
import Slider from '$components/Slider'
import ToggleSwitch from '$components/ToggleSwitch'
import Segmented from '$components/Segmented'
import MS from '$components/MS'
import { useTheme } from '$hooks/useTheme'
import { useStore } from '$store/index'
import { ApiClient } from '$services/api'
import { formatDate } from '$utils/format'
import { SETTINGS_ACCENTS as ACCENTS } from '$lib/constants'
import type {
  AdminOption,
  ApiKeyCreated,
  ApiKeyInfo,
  McpToolInfo,
  SettingsResponse,
  SettingsUpdateFn,
} from '$types/sections/settings'

/* ---------- shared layout atoms ---------- */
function Group({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div
      style={{
        marginBottom: 18,
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border-2)',
        borderRadius: 'var(--r-card, 12px)',
        padding: 'var(--pad-card, 18px)',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-1)', margin: 0 }}>{title}</h3>
        {sub && <div style={{ fontSize: 12.5, color: 'var(--fg-4)', marginTop: 3 }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

function Row({
  label,
  hint,
  children,
  last,
}: {
  label: string
  hint?: string
  children: ReactNode
  last?: boolean
}) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: 16,
        padding: '13px 0',
        borderBottom: last ? 'none' : '1px solid var(--border-1)',
      }}
    >
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13.5, fontWeight: 550, color: 'var(--fg-1)' }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

const fieldStyle: React.CSSProperties = {
  padding: '8px 11px',
  borderRadius: 'var(--r-btn, 8px)',
  border: '1px solid var(--border-2)',
  background: 'var(--bg-surface)',
  color: 'var(--fg-1)',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  outline: 'none',
  minWidth: 200,
}

function ProviderStatus({ status }: { status: 'connected' | 'offline' }) {
  const cfg =
    status === 'connected'
      ? { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Active' }
      : { bg: 'rgba(154,166,182,0.16)', color: 'var(--fg-3)', label: 'Available' }
  return (
    <span
      className="inline-flex items-center font-medium"
      style={{
        gap: 6,
        background: cfg.bg,
        color: cfg.color,
        borderRadius: 999,
        fontSize: 11,
        padding: '3px 8px',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {cfg.label}
    </span>
  )
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'AI'
  return parts
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

/* ---------- General ---------- */
function GeneralPane({
  settings,
  onUpdate,
}: {
  settings: SettingsResponse | null
  onUpdate: SettingsUpdateFn
}) {
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
      <Group title="Profile" sub="How you appear across Knik AI">
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
        <Row label="Display name">
          <input
            key={`dn-${displayName}`}
            defaultValue={displayName}
            onBlur={e => {
              if (e.target.value !== displayName) void onUpdate({ display_name: e.target.value })
            }}
            style={fieldStyle}
          />
        </Row>
        <Row label="Username" hint="Shown locally on this device" last>
          <input
            key={`un-${username}`}
            defaultValue={username}
            onBlur={e => {
              if (e.target.value !== username) void onUpdate({ username: e.target.value })
            }}
            style={fieldStyle}
          />
        </Row>
      </Group>

      <Group title="Defaults">
        <Row label="Default model" hint="Used for new chats">
          <select
            value={settings?.model ?? ''}
            onChange={e => void onUpdate({ model: e.target.value })}
            style={fieldStyle}
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
        </Row>
        <Row label="Stream responses" hint="Show tokens as they generate">
          <ToggleSwitch
            checked={settings?.stream_responses ?? true}
            onChange={v => void onUpdate({ stream_responses: v })}
          />
        </Row>
        <Row label="Send telemetry" hint="Anonymous usage to improve KNIK" last>
          <ToggleSwitch
            checked={settings?.send_telemetry ?? false}
            onChange={v => void onUpdate({ send_telemetry: v })}
          />
        </Row>
      </Group>

      <Group title="Danger zone" sub="Irreversible actions">
        <Row label="Delete all conversations" hint="Cannot be undone" last>
          <ActionButton
            variant="danger"
            size="sm"
            icon={<MS name="delete_forever" size={15} />}
            label="Delete"
            onClick={() => void handleClearHistory()}
          />
        </Row>
      </Group>
    </>
  )
}

/* ---------- Appearance ---------- */
function AppearancePane() {
  const { mode, accentName, density, radius, setMode, setAccent, setDensity, setRadius } =
    useTheme()
  const dark = mode !== 'light'
  return (
    <>
      <Group title="Theme" sub="KNIK is dark-first; light mode ships for Electron">
        <div className="grid grid-cols-2" style={{ gap: 12 }}>
          {[
            { k: 'dark' as const, label: 'Dark', on: dark },
            { k: 'light' as const, label: 'Light', on: !dark },
          ].map(o => (
            <button
              key={o.k}
              type="button"
              onClick={() => setMode(o.k)}
              className="text-left overflow-hidden"
              style={{
                padding: 0,
                borderRadius: 'var(--r-card, 12px)',
                cursor: 'pointer',
                border: `1.5px solid ${o.on ? 'var(--acc, var(--aurora-400))' : 'var(--border-2)'}`,
                background: 'transparent',
              }}
            >
              <div
                style={{
                  height: 80,
                  background: o.k === 'dark' ? '#0d1117' : '#f5f6f8',
                  padding: 12,
                }}
              >
                <div
                  style={{
                    width: '55%',
                    height: 8,
                    borderRadius: 4,
                    background: o.k === 'dark' ? '#1c2430' : '#dfe3e9',
                  }}
                />
                <div
                  style={{
                    width: '40%',
                    height: 8,
                    borderRadius: 4,
                    background: 'var(--acc, #00d9f4)',
                    marginTop: 7,
                  }}
                />
                <div
                  style={{
                    width: '70%',
                    height: 8,
                    borderRadius: 4,
                    background: o.k === 'dark' ? '#161c27' : '#e9ecf1',
                    marginTop: 7,
                  }}
                />
              </div>
              <div
                className="flex items-center justify-between"
                style={{ padding: '10px 12px', background: 'var(--bg-surface-2)' }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>
                  {o.label}
                </span>
                {o.on && (
                  <MS
                    name="check_circle"
                    size={17}
                    fill={1}
                    style={{ color: 'var(--acc-text, var(--aurora-300))' }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Accent color" sub="Drives buttons, links, and active states">
        <div className="flex flex-wrap" style={{ gap: 12 }}>
          {ACCENTS.map(a => {
            const on = accentName === a.id
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccent(a.id)}
                className="flex items-center"
                style={{
                  gap: 9,
                  padding: '9px 13px',
                  borderRadius: 'var(--r-btn, 10px)',
                  cursor: 'pointer',
                  border: `1.5px solid ${on ? a.color : 'var(--border-2)'}`,
                  background: on ? 'var(--bg-surface-3)' : 'var(--bg-surface)',
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: a.color,
                    boxShadow: `0 0 12px -2px ${a.color}`,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 550, color: 'var(--fg-1)' }}>
                  {a.label}
                </span>
                {on && <MS name="check" size={16} style={{ color: a.color }} />}
              </button>
            )
          })}
        </div>
      </Group>

      <Group title="Interface">
        <Row label="Compact density" hint="Tighter spacing in tables and lists">
          <ToggleSwitch
            checked={density === 'compact'}
            onChange={v => setDensity(v ? 'compact' : 'comfortable')}
          />
        </Row>
        <Row label="Corners" hint="Corner radius across the app" last>
          <Segmented
            size="sm"
            value={radius}
            onChange={v => setRadius(v as 'sharp' | 'default' | 'round')}
            options={[
              { value: 'sharp', label: 'Sharp' },
              { value: 'default', label: 'Default' },
              { value: 'round', label: 'Round' },
            ]}
          />
        </Row>
      </Group>
    </>
  )
}

/* ---------- Providers ---------- */
function ProvidersPane({
  settings,
  onUpdate,
}: {
  settings: SettingsResponse | null
  onUpdate: SettingsUpdateFn
}) {
  const [providers, setProviders] = useState<AdminOption[]>([])
  const [tools, setTools] = useState<McpToolInfo[]>([])

  const loadTools = async () => {
    try {
      setTools((await ApiClient.admin.getMcpTools()).tools)
    } catch (e) {
      console.error('Failed to load MCP tools:', e)
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        setProviders((await ApiClient.admin.getProviders()).providers)
      } catch (e) {
        console.error('Failed to load providers:', e)
      }
    })()
    void (async () => {
      try {
        setTools((await ApiClient.admin.getMcpTools()).tools)
      } catch (e) {
        console.error('Failed to load MCP tools:', e)
      }
    })()
  }, [])

  const toggleTool = async (t: McpToolInfo) => {
    setTools(prev => prev.map(x => (x.name === t.name ? { ...x, enabled: !x.enabled } : x)))
    try {
      await ApiClient.admin.toggleMcpTool(t.name, !t.enabled)
    } catch (e) {
      console.error('Failed to toggle MCP tool:', e)
      void loadTools()
    }
  }

  return (
    <>
      <Group title="AI providers" sub="Local-first — pick the model backend Knik uses">
        {providers.map((p, i) => {
          const active = settings?.provider === p.id
          return (
            <Row key={p.id} label={p.name} last={i === providers.length - 1}>
              <div className="flex items-center" style={{ gap: 12 }}>
                <ProviderStatus status={active ? 'connected' : 'offline'} />
                <ActionButton
                  variant={active ? 'secondary' : 'primary'}
                  size="sm"
                  label={active ? 'In use' : 'Use'}
                  onClick={active ? () => {} : () => void onUpdate({ provider: p.id })}
                />
              </div>
            </Row>
          )
        })}
        {providers.length === 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--fg-4)', padding: '8px 0' }}>
            Loading providers…
          </div>
        )}
      </Group>

      <Group title="MCP tools" sub="Toggle the tool groups available to workflows & chat">
        <div className="flex flex-wrap" style={{ gap: 8 }}>
          {tools.map(t => (
            <button
              key={t.name}
              type="button"
              onClick={() => void toggleTool(t)}
              className="inline-flex items-center transition-all ease-knik-out"
              style={{
                gap: 6,
                padding: '6px 11px',
                borderRadius: 999,
                cursor: 'pointer',
                border: `1px solid ${t.enabled ? 'var(--acc-border, rgba(0,217,244,0.4))' : 'var(--border-2)'}`,
                background: t.enabled ? 'var(--acc-soft)' : 'var(--bg-surface)',
                color: t.enabled ? 'var(--acc-text, var(--aurora-200))' : 'var(--fg-4)',
                opacity: t.enabled ? 1 : 0.65,
              }}
              title={`${t.category} · ${t.count} tools · ${t.enabled ? 'enabled' : 'disabled'}`}
            >
              <MS name="extension" size={14} />
              <span style={{ fontSize: 12.5, fontWeight: 550 }}>{t.name}</span>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--fg-5)' }}>
                {t.count}
              </span>
              <MS name={t.enabled ? 'check_circle' : 'radio_button_unchecked'} size={13} />
            </button>
          ))}
          {tools.length === 0 && (
            <Chip icon={<MS name="extension" size={14} />} label="Loading tools…" />
          )}
        </div>
      </Group>
    </>
  )
}

/* ---------- Voice ---------- */
function VoicePane({
  settings,
  onUpdate,
}: {
  settings: SettingsResponse | null
  onUpdate: SettingsUpdateFn
}) {
  const [voices, setVoices] = useState<AdminOption[]>([])
  const [rate, setRate] = useState(1)
  const [ttsEnabled, setTtsEnabled] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        setVoices((await ApiClient.admin.getVoices()).voices)
      } catch (e) {
        console.error('Failed to load voices:', e)
      }
    })()
  }, [])

  const sel = settings?.voice ?? ''

  return (
    <>
      <Group title="Text-to-speech" sub="Powered by Kokoro-82M · 9 voices · 10 languages">
        <Row label="Enable TTS" hint="Read assistant replies aloud">
          <ToggleSwitch checked={ttsEnabled} onChange={setTtsEnabled} />
        </Row>
        <Row label="Speaking rate" last>
          <div className="flex items-center" style={{ gap: 10, minWidth: 220 }}>
            <Slider
              min={0.5}
              max={2}
              step={0.1}
              value={rate}
              onChange={setRate}
              className="flex-1"
            />
            <code className="font-mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>
              {rate.toFixed(1)}×
            </code>
          </div>
        </Row>
      </Group>

      <Group title="Voice" sub="Default voice for synthesis">
        <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: 10 }}>
          {voices.map(v => {
            const on = sel === v.id
            const female = v.id.startsWith('af_')
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => void onUpdate({ voice: v.id })}
                className="text-left transition-all duration-150 ease-knik-out"
                style={{
                  padding: '12px 13px',
                  borderRadius: 'var(--r-btn, 10px)',
                  cursor: 'pointer',
                  border: `1.5px solid ${on ? 'var(--acc, var(--aurora-400))' : 'var(--border-2)'}`,
                  background: on ? 'var(--acc-soft)' : 'var(--bg-surface)',
                }}
              >
                <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
                  <span
                    className="flex items-center justify-center"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: female ? 'rgba(139,92,246,0.16)' : 'var(--acc-soft)',
                      color: female ? 'var(--violet-400)' : 'var(--acc-text, var(--aurora-300))',
                    }}
                  >
                    <MS name="graphic_eq" size={16} />
                  </span>
                  {on && (
                    <MS
                      name="check_circle"
                      size={16}
                      fill={1}
                      style={{ color: 'var(--acc-text, var(--aurora-300))', marginLeft: 'auto' }}
                    />
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>{v.name}</div>
                <code className="font-mono" style={{ fontSize: 10.5, color: 'var(--fg-4)' }}>
                  {v.id}
                </code>
              </button>
            )
          })}
        </div>
      </Group>
    </>
  )
}

/* ---------- API keys ---------- */
function KeysPane() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([])
  const [created, setCreated] = useState<ApiKeyCreated | null>(null)

  const load = async () => {
    try {
      setKeys((await ApiClient.admin.listApiKeys()).api_keys)
    } catch (e) {
      console.error('Failed to load API keys:', e)
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        setKeys((await ApiClient.admin.listApiKeys()).api_keys)
      } catch (e) {
        console.error('Failed to load API keys:', e)
      }
    })()
  }, [])

  const handleCreate = async () => {
    const label = window.prompt('Name this API key:')
    if (!label?.trim()) return
    try {
      const res = await ApiClient.admin.createApiKey(label.trim())
      setCreated(res)
      await load()
    } catch (e) {
      console.error('Failed to create API key:', e)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Revoke this API key? Apps using it will stop working.')) return
    try {
      await ApiClient.admin.deleteApiKey(id)
      await load()
    } catch (e) {
      console.error('Failed to revoke API key:', e)
    }
  }

  return (
    <Group title="API keys" sub="Use these to call the KNIK API from your own apps">
      {created && (
        <div
          style={{
            marginBottom: 14,
            padding: '13px 14px',
            borderRadius: 'var(--r-btn, 10px)',
            border: '1px solid var(--acc-border, rgba(0,217,244,0.4))',
            background: 'var(--acc-soft)',
          }}
        >
          <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
            <MS name="warning" size={15} style={{ color: 'var(--acc-text, var(--aurora-300))' }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-1)' }}>
              Copy your key now — it won’t be shown again.
            </span>
          </div>
          <div className="flex items-center" style={{ gap: 8 }}>
            <code
              className="font-mono flex-1 truncate"
              style={{ fontSize: 12, color: 'var(--fg-2)' }}
            >
              {created.key}
            </code>
            <ActionIcon
              size={30}
              icon={<MS name="content_copy" size={15} />}
              title="Copy"
              onClick={() => void navigator.clipboard.writeText(created.key)}
            />
            <ActionButton
              variant="secondary"
              size="sm"
              label="Done"
              onClick={() => setCreated(null)}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end" style={{ marginBottom: 8 }}>
        <ActionButton
          variant="primary"
          size="sm"
          icon={<MS name="add" size={15} />}
          label="Create key"
          onClick={() => void handleCreate()}
        />
      </div>

      {keys.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--fg-4)', padding: '10px 0' }}>
          No API keys yet. Create one to call the KNIK API.
        </div>
      ) : (
        keys.map((k, i) => (
          <div
            key={k.id}
            className="flex items-center"
            style={{
              gap: 14,
              padding: '13px 0',
              borderBottom: i === keys.length - 1 ? 'none' : '1px solid var(--border-1)',
            }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--r-btn, 8px)',
                background: 'var(--bg-surface-3)',
                color: 'var(--fg-3)',
              }}
            >
              <MS name="key" size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center" style={{ gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>
                  {k.label}
                </span>
                {k.scopes.map(scope => (
                  <Chip key={scope} label={scope} />
                ))}
              </div>
              <code className="font-mono" style={{ fontSize: 12, color: 'var(--fg-4)' }}>
                {k.key_prefix}••••••••••••
              </code>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                {k.last_used_at ? `Used ${formatDate(k.last_used_at)}` : 'Never used'}
              </div>
              <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--fg-5)' }}>
                {formatDate(k.created_at ?? undefined)}
              </div>
            </div>
            <ActionIcon
              size={32}
              icon={<MS name="delete" size={15} />}
              title="Revoke"
              danger
              onClick={() => void handleDelete(k.id)}
            />
          </div>
        ))
      )}
    </Group>
  )
}

/** Settings page: General · Appearance · Providers · Voice · API keys. */
export default function Settings() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setSettings(await ApiClient.admin.getSettings())
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    })()
  }, [])

  const onUpdate: SettingsUpdateFn = async patch => {
    setSettings(prev => (prev ? ({ ...prev, ...patch } as SettingsResponse) : prev))
    try {
      await ApiClient.admin.updateSettings(patch)
      setSettings(await ApiClient.admin.getSettings())
    } catch (e) {
      console.error('Failed to update settings:', e)
    }
  }

  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: 'tune',
      content: <GeneralPane settings={settings} onUpdate={onUpdate} />,
    },
    { id: 'appearance', label: 'Appearance', icon: 'palette', content: <AppearancePane /> },
    {
      id: 'providers',
      label: 'Providers',
      icon: 'hub',
      content: <ProvidersPane settings={settings} onUpdate={onUpdate} />,
    },
    {
      id: 'voice',
      label: 'Voice',
      icon: 'graphic_eq',
      content: <VoicePane settings={settings} onUpdate={onUpdate} />,
    },
    { id: 'keys', label: 'API keys', icon: 'key', content: <KeysPane /> },
  ]

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 32px 48px' }}>
        <div style={{ marginBottom: 14 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '-0.015em',
              color: 'var(--fg-1)',
              margin: 0,
            }}
          >
            Settings
          </h2>
          <div style={{ fontSize: 12.5, color: 'var(--fg-4)', marginTop: 3 }}>
            Manage your workspace, models, and account
          </div>
        </div>
        <VerticalTabs tabs={tabs} />
      </div>
    </div>
  )
}
