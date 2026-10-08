import { useId, useState } from 'react'
import Button from '$components/buttons/Button'
import MS from '$components/display/MS'
import Input from '$components/forms/Input'
import Modal from '$components/surfaces/Modal'
import ConfirmDialog from '$components/surfaces/ConfirmDialog'
import ApiKeyRow from '$components/settings/ApiKeyRow'
import KeyReveal from '$components/settings/KeyReveal'
import FormGroup from '$widgets/FormGroup'
import type { ApiKeyCreated, ApiKeyInfo } from '$types/sections/settings'
import { useDemoSession } from '../session/useDemoSession'
import { useSettingsCatalog } from '../session/useSettingsCatalog'

export default function KeysPane() {
  const keys = useSettingsCatalog('apiKeys')
  const scenarios = useDemoSession(s => s.keyScenarios)
  const createDemoKey = useDemoSession(s => s.createDemoKey)
  const deleteKey = useDemoSession(s => s.deleteKey)
  const addToast = useDemoSession(s => s.addToast)
  const [created, setCreated] = useState<ApiKeyCreated | null>(null)
  const [creating, setCreating] = useState(false)
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<ApiKeyInfo | null>(null)
  const id = useId()
  const available = scenarios.some(scenario => !keys.some(key => key.id === scenario.id))

  const closeEditor = () => {
    setCreating(false)
    setLabel('')
    setError('')
  }
  const copyKey = async () => {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.key)
      addToast('Demo key copied.', 'success')
    } catch {
      addToast('The demo key could not be copied.', 'error')
    }
  }

  return (
    <FormGroup title="API keys" sub="Demo keys are managed locally for this session">
      {created && (
        <KeyReveal
          value={created.key}
          onCopy={() => void copyKey()}
          onDismiss={() => setCreated(null)}
        />
      )}
      <div className="flex justify-end mb-2">
        <Button
          variant="primary"
          size="sm"
          aria-label="Create key"
          icon={<MS name="add" size={15} />}
          disabled={!available}
          onClick={() => setCreating(true)}
        >
          Create key
        </Button>
      </div>
      {!available && (
        <p className="text-xs text-[var(--fg-4)] mb-3">
          Key creation is unavailable without an unused supplied demo key scenario.
        </p>
      )}
      {keys.length ? (
        keys.map((key, index) => (
          <ApiKeyRow
            key={key.id}
            apiKey={key}
            last={index === keys.length - 1}
            onDelete={() => setDeleting(key)}
          />
        ))
      ) : (
        <p className="text-[12.5px] text-[var(--fg-4)] py-2.5">No API keys available.</p>
      )}
      <Modal isOpen={creating} onClose={closeEditor} title="Create demo key" size="sm">
        <form
          onSubmit={event => {
            event.preventDefault()
            if (!label.trim()) {
              setError('Enter a key name.')
              return
            }
            const result = createDemoKey(label)
            if (!result.ok) {
              setError(result.error)
              return
            }
            setCreated(scenarios.find(scenario => scenario.id === result.id) ?? null)
            closeEditor()
            addToast('Demo key added to this session.', 'success')
          }}
        >
          <label htmlFor={`${id}-label`} className="block text-sm font-medium mb-2">
            Key name
          </label>
          <Input
            id={`${id}-label`}
            value={label}
            onChange={event => {
              setLabel(event.target.value)
              setError('')
            }}
            error={error}
            required
            autoFocus
            density="compact"
          />
          <p className="text-xs text-[var(--fg-4)] mt-2">
            Use a label from the supplied demo scenarios.
          </p>
          <div className="flex justify-end gap-2 mt-5">
            <Button onClick={closeEditor}>Cancel</Button>
            <Button type="submit" variant="primary">
              Create key
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={!!deleting}
        title="Remove demo key?"
        message={`Remove ${deleting?.label ?? 'this key'} from the current session?`}
        confirmLabel="Remove key"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          deleteKey(deleting.id)
          if (created?.id === deleting.id) setCreated(null)
          setDeleting(null)
          addToast('Demo key removed from this session.', 'success')
        }}
      />
    </FormGroup>
  )
}
