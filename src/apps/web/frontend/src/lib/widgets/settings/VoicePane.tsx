import { useId } from 'react'
import Radio from '$components/forms/Radio'
import ToggleSwitch from '$components/forms/ToggleSwitch'
import Slider from '$components/forms/Slider'
import VoiceOption from '$components/settings/VoiceOption'
import FormGroup from '$widgets/FormGroup'
import FormRow from '$widgets/FormRow'
import { useSettingsStore } from '$stores/settings'
import { useCatalog } from '$stores/catalogs'

export default function VoicePane() {
  const id = useId()
  const voices = useCatalog('voices')
  const settings = useSettingsStore(s => s.settings)
  const updateSettings = useSettingsStore(s => s.updateSettings)

  return (
    <>
      <FormGroup title="Text-to-speech" sub="Preferences only; this frontend plays no audio">
        <FormRow label="Enable TTS">
          <ToggleSwitch
            aria-label="Enable TTS"
            checked={settings.tts_enabled}
            onChange={tts_enabled => updateSettings({ tts_enabled })}
          />
        </FormRow>
        <FormRow label="Speaking rate" htmlFor={`${id}-rate`} last>
          <div className="w-full min-w-0 sm:w-[260px]">
            <Slider
              id={`${id}-rate`}
              min={0.5}
              max={2}
              step={0.1}
              value={settings.speaking_rate}
              formatValue={rate => `${rate.toFixed(1)}×`}
              onChange={speaking_rate => updateSettings({ speaking_rate })}
            />
          </div>
        </FormRow>
      </FormGroup>
      <FormGroup title="Voice" sub="Choose a default voice for this session" bodyClassName="p-1.5">
        {voices.length ? (
          <Radio
            name={`${id}-voice`}
            label="Default voice"
            hideLabel
            presentation="card"
            optionsClassName="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-0.5"
            value={settings.voice}
            onChange={voice => updateSettings({ voice })}
            options={voices.map(voice => ({
              value: voice.id,
              label: <VoiceOption voice={voice} active={settings.voice === voice.id} />,
            }))}
          />
        ) : (
          <p className="px-3 py-2.5 text-body-sm text-fg-4">No voices available.</p>
        )}
      </FormGroup>
    </>
  )
}
