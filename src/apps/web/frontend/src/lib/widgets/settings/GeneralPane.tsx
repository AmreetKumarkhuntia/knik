import { useId, useState } from 'react'
import Button from '$components/buttons/Button'
import MS from '$components/display/MS'
import Input from '$components/forms/Input'
import Select from '$components/forms/Select'
import ToggleSwitch from '$components/forms/ToggleSwitch'
import ConfirmDialog from '$components/surfaces/ConfirmDialog'
import ProfileSummary from '$components/settings/ProfileSummary'
import FormGroup from '$widgets/FormGroup'
import FormRow from '$widgets/FormRow'
import { useDemoSession } from '../session/useDemoSession'
import { useSettingsCatalog } from '../session/useSettingsCatalog'

export default function GeneralPane() {
  const settings = useDemoSession(s => s.settings)
  const models = useSettingsCatalog('models')
  const updateSettings = useDemoSession(s => s.updateSettings)
  const clearConversations = useDemoSession(s => s.clearConversations)
  const conversationCount = useDemoSession(s => s.conversations.length)
  const addToast = useDemoSession(s => s.addToast)
  const [displayName, setDisplayName] = useState(settings.display_name ?? '')
  const [username, setUsername] = useState(settings.username ?? '')
  const [confirmClear, setConfirmClear] = useState(false)
  const id = useId()
  const dirty =
    displayName !== (settings.display_name ?? '') || username !== (settings.username ?? '')
  const resetDraft = () => {
    setDisplayName(settings.display_name ?? '')
    setUsername(settings.username ?? '')
  }

  return (
    <>
      <FormGroup title="Profile" sub="How you appear across Knik AI">
        <ProfileSummary displayName={settings.display_name ?? ''} />
        <form
          onSubmit={event => {
            event.preventDefault()
            updateSettings({ display_name: displayName.trim(), username: username.trim() })
            setDisplayName(displayName.trim())
            setUsername(username.trim())
            addToast('Profile saved for this session.', 'success')
          }}
        >
          <FormRow label="Display name" htmlFor={`${id}-display-name`}>
            <Input
              id={`${id}-display-name`}
              value={displayName}
              onChange={event => setDisplayName(event.target.value)}
              density="compact"
              fullWidth={false}
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
              onChange={event => setUsername(event.target.value)}
              density="compact"
              fullWidth={false}
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
            options={models.map(model => ({ value: model.id, label: model.label }))}
            value={settings.model}
            onValueChange={model => updateSettings({ model })}
            placeholder={models.length ? 'Select a model' : 'No models available'}
            disabled={models.length === 0}
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
            onClick={() => setConfirmClear(true)}
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
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearConversations()
          setConfirmClear(false)
          addToast('Conversations removed from this session.', 'success')
        }}
      />
    </>
  )
}
