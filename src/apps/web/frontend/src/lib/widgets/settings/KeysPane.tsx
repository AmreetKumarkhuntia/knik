import { useId } from 'react'
import Button from '$components/buttons/Button'
import MS from '$components/display/MS'
import Input from '$components/forms/Input'
import Modal from '$components/surfaces/Modal'
import ConfirmDialog from '$components/surfaces/ConfirmDialog'
import ApiKeyRow from '$components/settings/ApiKeyRow'
import KeyReveal from '$components/settings/KeyReveal'
import FormGroup from '$widgets/FormGroup'
import { useCredentialsStore, useCredentialsScope } from '$stores/credentials'
import { useFeedbackStore } from '$stores/feedback'
import { useCredentialsView } from '$stores/views'
import { useCopyToClipboard } from '$widgets/feedback/useCopyToClipboard'

export default function KeysPane() {
  const { scopeId, scope, patch } = useCredentialsScope()
  const { created, creating, label, error } = scope
  const { keys, available, deleting } = useCredentialsView(scopeId)
  const createDemoKey = useCredentialsStore(s => s.createDemoKey)
  const deleteKey = useCredentialsStore(s => s.deleteKey)
  const closeCredentialEditor = useCredentialsStore(s => s.closeEditor)
  const addToast = useFeedbackStore(s => s.addToast)
  const copy = useCopyToClipboard('Demo key copied.')
  const id = useId()
  const closeEditor = () => closeCredentialEditor(scopeId)

  return (
    <FormGroup title="API keys" sub="Demo keys are managed locally for this session">
      {created && (
        <KeyReveal
          value={created.key}
          onCopy={() => copy(created.key)}
          onDismiss={() => patch({ created: null })}
        />
      )}
      <div className="flex justify-end mb-2">
        <Button
          variant="primary"
          size="sm"
          aria-label="Create key"
          icon={<MS name="add" size={15} />}
          disabled={!available}
          onClick={() => patch({ creating: true })}
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
            onDelete={() => patch({ deletingId: key.id })}
          />
        ))
      ) : (
        <p className="text-[12.5px] text-[var(--fg-4)] py-2.5">No API keys available.</p>
      )}
      <Modal isOpen={creating} onClose={closeEditor} title="Create demo key" size="sm">
        <form
          onSubmit={event => {
            event.preventDefault()
            const result = createDemoKey(scopeId)
            if (!result.ok) return
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
              patch({ label: event.target.value, error: '' })
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
        onCancel={() => patch({ deletingId: null })}
        onConfirm={() => {
          if (!deleting) return
          deleteKey(deleting.id)
          if (created?.id === deleting.id) patch({ created: null })
          patch({ deletingId: null })
          addToast('Demo key removed from this session.', 'success')
        }}
      />
    </FormGroup>
  )
}
