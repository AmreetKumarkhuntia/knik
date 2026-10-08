import { useId } from 'react'
import Button from '$components/buttons/Button'
import MS from '$components/display/MS'
import Input from '$components/forms/Input'
import Select from '$components/forms/Select'
import ToggleSwitch from '$components/forms/ToggleSwitch'
import ConfirmDialog from '$components/surfaces/ConfirmDialog'
import ProfileSummary from '$components/settings/ProfileSummary'
import FormGroup from '$widgets/FormGroup'
import FormRow from '$widgets/FormRow'
import { useSettingsStore, useSettingsScope } from '$stores/settings'
import { useChatStore } from '$stores/chat'
import { useFeedbackStore } from '$stores/feedback'
import { useProfileView } from '$stores/views'

export default function GeneralPane() {
  const { scopeId, scope, patch } = useSettingsScope()
  const { displayName, username, confirmClear } = scope
  const { settings, dirty, modelOptions } = useProfileView(scopeId)
  const updateSettings = useSettingsStore(s => s.updateSettings)
  const resetProfile = useSettingsStore(s => s.resetProfile)
  const saveProfile = useSettingsStore(s => s.saveProfile)
  const clearConversations = useChatStore(s => s.clearConversations)
  const conversationCount = useChatStore(s => s.conversations.length)
  const addToast = useFeedbackStore(s => s.addToast)
  const id = useId()
  const resetDraft = () => resetProfile(scopeId)

  return (
    <>
      <FormGroup title="Profile" sub="How you appear across Knik AI">
        <ProfileSummary displayName={settings.display_name ?? ''} />
        <form
          onSubmit={event => {
            event.preventDefault()
            const result = saveProfile(scopeId)
            if (!result.ok) return
            addToast('Profile saved for this session.', 'success')
          }}
        >
          <FormRow label="Display name" htmlFor={`${id}-display-name`}>
            <Input
              id={`${id}-display-name`}
              value={displayName}
              onChange={event => patch({ displayName: event.target.value })}
              density="compact"
              fullWidth={false}
              className="w-full sm:w-[260px]"
            />
          </FormRow>
          <FormRow
            label="Username"
            htmlFor={`${id}-username`}
            hint="Shown locally in this session"
            hintId={`${id}-username-hint`}
            last
          >
            <Input
              id={`${id}-username`}
              aria-describedby={`${id}-username-hint`}
              value={username}
              onChange={event => patch({ username: event.target.value })}
              density="compact"
              fullWidth={false}
              className="w-full sm:w-[260px]"
            />
          </FormRow>
          <div className="flex justify-end gap-2 mt-3">
            <Button size="sm" disabled={!dirty} onClick={resetDraft}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!dirty}>
              Save profile
            </Button>
          </div>
        </form>
      </FormGroup>
      <FormGroup title="Defaults">
        <FormRow
          label="Default model"
          htmlFor={`${id}-model`}
          hint="Used for new chats"
          hintId={`${id}-model-hint`}
        >
          <Select
            id={`${id}-model`}
            aria-describedby={`${id}-model-hint`}
            presentation="native"
            className="w-full sm:w-[260px]"
            options={modelOptions}
            value={settings.model}
            onValueChange={model => updateSettings({ model })}
            placeholder={modelOptions.length ? 'Select a model' : 'No models available'}
            disabled={modelOptions.length === 0}
          />
        </FormRow>
        <FormRow label="Stream responses" hint="Preference for supplied chat scenarios">
          <ToggleSwitch
            aria-label="Stream responses"
            checked={settings.stream_responses}
            onChange={stream_responses => updateSettings({ stream_responses })}
          />
        </FormRow>
        <FormRow
          label="Send telemetry"
          hint="Preference only; this frontend sends no telemetry"
          last
        >
          <ToggleSwitch
            aria-label="Send telemetry"
            checked={settings.send_telemetry}
            onChange={send_telemetry => updateSettings({ send_telemetry })}
          />
        </FormRow>
      </FormGroup>
      <FormGroup title="Conversation history" sub="Changes apply to this session">
        <FormRow
          label="Delete all conversations"
          hint="Reload restores the supplied demo source"
          last
        >
          <Button
            variant="danger"
            size="sm"
            aria-label="Delete conversations"
            icon={<MS name="delete_forever" size={15} />}
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
