import { useId } from 'react'
import Radio from '$components/forms/Radio'
import ToggleSwitch from '$components/forms/ToggleSwitch'
import Slider from '$components/forms/Slider'
import VoiceOption from '$components/settings/VoiceOption'
import FormGroup from '$widgets/FormGroup'
import FormRow from '$widgets/FormRow'
import { useSettingsStore } from '$stores/settings'
import { useVoiceView } from '$stores/views'

export default function VoicePane() {
  const id = useId()
  const { voices } = useVoiceView()
  const settings = useSettingsStore(s => s.settings)
  const updateSettings = useSettingsStore(s => s.updateSettings)

  return (
    <>
      <FormGroup title="Text-to-speech" sub="Configure voice playback for this session">
        <FormRow label="Enable TTS" hint="Enable playback when audio is available">
          <ToggleSwitch
            aria-label="Enable TTS"
            checked={settings.tts_enabled}
            onChange={tts_enabled => updateSettings({ tts_enabled })}
          />
        </FormRow>
        <FormRow label="Speaking rate" last>
          <div className="flex-1 max-w-[260px] min-w-0">
            <Slider
              label="Speaking rate"
              min={0.5}
              max={2}
              step={0.1}
              value={settings.speaking_rate}
              onChange={speaking_rate => updateSettings({ speaking_rate })}
            />
          </div>
        </FormRow>
      </FormGroup>
      <FormGroup title="Voice" sub="Choose a default voice for this session">
        {voices.length ? (
          <Radio
            name={`${id}-voice`}
            label="Default voice"
            presentation="standard"
            value={settings.voice}
            onChange={voice => updateSettings({ voice })}
            options={voices.map(voice => ({
              value: voice.id,
              label: <VoiceOption voice={voice} />,
            }))}
          />
        ) : (
          <p className="text-body-sm text-[var(--fg-4)] py-2">No voices available.</p>
        )}
      </FormGroup>
    </>
  )
}
