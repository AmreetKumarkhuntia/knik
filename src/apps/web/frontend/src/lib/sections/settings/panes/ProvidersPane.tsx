import { useState, useEffect } from 'react'
import { ActionButton, Chip, MS } from '$components'
import { FormGroup, FormRow, StatusPill } from '$widgets'
import { ApiClient } from '$services/api'
import type { AdminOption, McpToolInfo, SettingsPaneProps } from '$types/sections/settings'

/** Provider selection and MCP tool toggles. */
export default function ProvidersPane({ settings, onUpdate }: SettingsPaneProps) {
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
      <FormGroup title="AI providers" sub="Local-first — pick the model backend Knik uses">
        {providers.map((p, i) => {
          const active = settings?.provider === p.id
          return (
            <FormRow key={p.id} label={p.name} last={i === providers.length - 1}>
              <div className="flex items-center" style={{ gap: 12 }}>
                <StatusPill
                  tone={active ? 'success' : 'neutral'}
                  label={active ? 'Active' : 'Available'}
                />
                <ActionButton
                  variant={active ? 'secondary' : 'primary'}
                  size="sm"
                  label={active ? 'In use' : 'Use'}
                  onClick={active ? () => {} : () => void onUpdate({ provider: p.id })}
                />
              </div>
            </FormRow>
          )
        })}
        {providers.length === 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--fg-4)', padding: '8px 0' }}>
            Loading providers…
          </div>
        )}
      </FormGroup>

      <FormGroup title="MCP tools" sub="Toggle the tool groups available to workflows & chat">
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
      </FormGroup>
    </>
  )
}
