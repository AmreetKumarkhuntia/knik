import Button from '$components/buttons/Button'
import MS from '$components/display/MS'
import ConfirmDialog from '$components/surfaces/ConfirmDialog'
import FormGroup from '$widgets/FormGroup'
import FormRow from '$widgets/FormRow'
import { useSettingsScope } from '$stores/settings'
import { useChatStore } from '$stores/chat'
import { useFeedbackStore } from '$stores/feedback'

export default function GeneralPane() {
  const { scope, patch } = useSettingsScope()
  const { confirmClear } = scope
  const clearConversations = useChatStore(s => s.clearConversations)
  const conversationCount = useChatStore(s => s.conversations.length)
  const addToast = useFeedbackStore(s => s.addToast)

  return (
    <>
      <FormGroup
        title="Conversation history"
        sub="Changes apply to this session"
        bodyClassName="px-[18px]"
      >
        <FormRow
          label="Delete all conversations"
          hint="Reload restores the supplied demo source"
          last
        >
          <Button
            variant="danger"
            size="sm"
            className="pl-2.5"
            aria-label="Delete conversations"
            icon={<MS name="delete_forever" size={16} />}
            disabled={conversationCount === 0}
            onClick={() => patch({ confirmClear: true })}
          >
            Delete
          </Button>
        </FormRow>
      </FormGroup>
      <ConfirmDialog
        isOpen={confirmClear}
        title="Delete all conversations?"
        message="This removes conversations from the current session. Reloading restores the supplied demo source."
        confirmLabel="Delete conversations"
        onCancel={() => patch({ confirmClear: false })}
        onConfirm={() => {
          clearConversations()
          patch({ confirmClear: false })
          addToast('Conversations removed from this session.', 'success')
        }}
      />
    </>
  )
}
