import { useState, useEffect } from 'react'
import { ActionButton, ActionIcon, Chip, MS } from '$components'
import { FormGroup, IconTile } from '$widgets'
import { ApiClient } from '$services/api'
import { formatDate } from '$utils/format'
import type { ApiKeyCreated, ApiKeyInfo } from '$types/sections/settings'

/** API keys: create, list, and revoke keys for the KNIK API. */
export default function KeysPane() {
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
    <FormGroup title="API keys" sub="Use these to call the KNIK API from your own apps">
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
            <IconTile
              bg="var(--bg-surface-3)"
              color="var(--fg-3)"
              icon={<MS name="key" size={17} />}
            />
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
    </FormGroup>
  )
}
