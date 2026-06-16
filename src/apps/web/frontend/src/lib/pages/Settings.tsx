import { useState } from 'react'
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
import {
  DEMO_ACCOUNT,
  DEMO_PROVIDERS,
  DEMO_MCP_TOOLS,
  DEMO_VOICES,
  DEMO_API_KEYS,
  SETTINGS_ACCENTS as ACCENTS,
} from '$lib/constants'

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
      ? { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Connected' }
      : { bg: 'rgba(154,166,182,0.16)', color: 'var(--fg-3)', label: 'Offline' }
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

/* ---------- General ---------- */
function GeneralPane() {
  const handleClearHistory = useStore(s => s.handleClearHistory)
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
          <Avatar initials={DEMO_ACCOUNT.initials} size={56} color="accent" />
          <div className="flex-1">
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-1)' }}>
              {DEMO_ACCOUNT.name}
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
          <ActionButton
            variant="secondary"
            size="sm"
            icon={<MS name="photo_camera" size={15} />}
            label="Change"
          />
        </div>
        <Row label="Display name">
          <input defaultValue={DEMO_ACCOUNT.name} style={fieldStyle} />
        </Row>
        <Row label="Username" hint="Shown locally on this device" last>
          <input defaultValue={DEMO_ACCOUNT.handle} style={fieldStyle} />
        </Row>
      </Group>

      <Group title="Defaults">
        <Row label="Default model" hint="Used for new chats">
          <div className="flex items-center" style={{ ...fieldStyle, display: 'flex', gap: 8 }}>
            <span
              style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal-400)' }}
            />
            Gemini 1.5 Flash
          </div>
        </Row>
        <Row label="Stream responses" hint="Show tokens as they generate">
          <ToggleSwitch checked onChange={() => {}} />
        </Row>
        <Row label="Send telemetry" hint="Anonymous usage to improve KNIK" last>
          <ToggleSwitch checked={false} onChange={() => {}} />
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
function ProvidersPane() {
  return (
    <>
      <Group title="AI providers" sub="Local-first — connect the models you run">
        {DEMO_PROVIDERS.map((p, i) => (
          <Row key={p.id} label={p.name} hint={p.models} last={i === DEMO_PROVIDERS.length - 1}>
            <div className="flex items-center" style={{ gap: 12 }}>
              <ProviderStatus status={p.status} />
              <ActionButton
                variant={p.status === 'offline' ? 'primary' : 'secondary'}
                size="sm"
                label={p.status === 'offline' ? 'Connect' : 'Manage'}
              />
            </div>
          </Row>
        ))}
      </Group>

      <Group title="MCP tools" sub="Enabled integrations available to workflows & chat">
        <div className="flex flex-wrap" style={{ gap: 8 }}>
          {DEMO_MCP_TOOLS.map(t => (
            <Chip
              key={t.name}
              icon={<MS name="extension" size={14} />}
              label={
                <>
                  {t.name}
                  <span
                    className="font-mono"
                    style={{ fontSize: 10, color: 'var(--fg-5)', marginLeft: 4 }}
                  >
                    {t.count}
                  </span>
                </>
              }
            />
          ))}
          <Chip variant="input" icon={<MS name="add" size={14} />} label="Add tool" />
        </div>
      </Group>
    </>
  )
}

/* ---------- Voice ---------- */
function VoicePane() {
  const [sel, setSel] = useState('af_heart')
  const [rate, setRate] = useState(1)
  return (
    <>
      <Group title="Text-to-speech" sub="Powered by Kokoro-82M · 9 voices · 10 languages">
        <Row label="Enable TTS" hint="Read assistant replies aloud">
          <ToggleSwitch checked onChange={() => {}} />
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
          {DEMO_VOICES.map(v => {
            const on = sel === v.id
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSel(v.id)}
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
                      background: v.gender === 'F' ? 'rgba(139,92,246,0.16)' : 'var(--acc-soft)',
                      color:
                        v.gender === 'F'
                          ? 'var(--violet-400)'
                          : 'var(--acc-text, var(--aurora-300))',
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
                <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 3 }}>
                  {v.lang} · {v.gender === 'F' ? 'Female' : 'Male'}
                </div>
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
  return (
    <Group title="API keys" sub="Use these to call the KNIK API from your own apps">
      <div className="flex justify-end" style={{ marginBottom: 8 }}>
        <ActionButton
          variant="primary"
          size="sm"
          icon={<MS name="add" size={15} />}
          label="Create key"
        />
      </div>
      {DEMO_API_KEYS.map((k, i) => (
        <div
          key={k.id}
          className="flex items-center"
          style={{
            gap: 14,
            padding: '13px 0',
            borderBottom: i === DEMO_API_KEYS.length - 1 ? 'none' : '1px solid var(--border-1)',
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
              <Chip label={k.scope} />
            </div>
            <code className="font-mono" style={{ fontSize: 12, color: 'var(--fg-4)' }}>
              {k.prefix}••••••••••••
            </code>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Used {k.lastUsed}</div>
            <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--fg-5)' }}>
              {k.created}
            </div>
          </div>
          <ActionIcon size={32} icon={<MS name="content_copy" size={15} />} title="Copy" />
          <ActionIcon size={32} icon={<MS name="delete" size={15} />} title="Revoke" danger />
        </div>
      ))}
    </Group>
  )
}

/** Settings page: General · Appearance · Providers · Voice · API keys. */
export default function Settings() {
  const tabs = [
    { id: 'general', label: 'General', icon: 'tune', content: <GeneralPane /> },
    { id: 'appearance', label: 'Appearance', icon: 'palette', content: <AppearancePane /> },
    { id: 'providers', label: 'Providers', icon: 'hub', content: <ProvidersPane /> },
    { id: 'voice', label: 'Voice', icon: 'graphic_eq', content: <VoicePane /> },
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
