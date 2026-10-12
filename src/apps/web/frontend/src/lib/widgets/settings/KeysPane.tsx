import ApiKeyRow from '$components/settings/ApiKeyRow'
import ConfirmDialog from '$components/surfaces/ConfirmDialog'
import FormGroup from '$widgets/FormGroup'
import { useCredentialsStore, useCredentialsScope } from '$stores/credentials'
import { useFeedbackStore } from '$stores/feedback'
import { useCredentialsView } from '$stores/views'

export default function KeysPane() {
  const { scopeId, patch } = useCredentialsScope()
  const { keys, deleting } = useCredentialsView(scopeId)
  const deleteKey = useCredentialsStore(s => s.deleteKey)
  const addToast = useFeedbackStore(s => s.addToast)

  return (
    <FormGroup title="API keys" sub="Demo keys are managed locally for this session">
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
        <p className="text-body-sm text-[var(--fg-4)] py-2.5">No API keys available.</p>
      )}
      <ConfirmDialog
        isOpen={!!deleting}
        title="Remove demo key?"
        message={`Remove ${deleting?.label ?? 'this key'} from the current session?`}
        confirmLabel="Remove key"
        onCancel={() => patch({ deletingId: null })}
        onConfirm={() => {
          if (!deleting) return
          deleteKey(deleting.id)
          patch({ deletingId: null })
          addToast('Demo key removed from this session.', 'success')
        }}
      />
    </FormGroup>
  )
}
