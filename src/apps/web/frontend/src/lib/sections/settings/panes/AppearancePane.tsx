import { ToggleSwitch, Segmented, MS } from '$components'
import { FormGroup, FormRow } from '$widgets'
import { useTheme } from '$hooks/useTheme'
import { SETTINGS_ACCENTS as ACCENTS } from '$lib/constants'

/** Appearance settings: theme, accent color, and interface density/corners. */
export default function AppearancePane() {
  const { mode, accentName, density, radius, setMode, setAccent, setDensity, setRadius } =
    useTheme()
  const dark = mode !== 'light'
  return (
    <>
      <FormGroup title="Theme" sub="KNIK is dark-first; light mode ships for Electron">
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
      </FormGroup>

      <FormGroup title="Accent color" sub="Drives buttons, links, and active states">
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
      </FormGroup>

      <FormGroup title="Interface">
        <FormRow label="Compact density" hint="Tighter spacing in tables and lists">
          <ToggleSwitch
            checked={density === 'compact'}
            onChange={v => setDensity(v ? 'compact' : 'comfortable')}
          />
        </FormRow>
        <FormRow label="Corners" hint="Corner radius across the app" last>
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
        </FormRow>
      </FormGroup>
    </>
  )
}
