import { useEffect, useId, useRef, useState } from 'react'
import Button from '$components/buttons/Button'
import Radio from '$components/forms/Radio'
import ToggleSwitch from '$components/forms/ToggleSwitch'
import Slider from '$components/forms/Slider'
import VoiceOption from '$components/settings/VoiceOption'
import FormGroup from '$widgets/FormGroup'
import FormRow from '$widgets/FormRow'
import { useDemoSession } from '../session/useDemoSession'
import { useSettingsCatalog } from '../session/useSettingsCatalog'

export default function VoicePane() {
  const id = useId()
  const voices = useSettingsCatalog('voices')
  const settings = useDemoSession(s => s.settings)
  const updateSettings = useDemoSession(s => s.updateSettings)
  const addToast = useDemoSession(s => s.addToast)
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const selected = voices.find(voice => voice.id === settings.voice)

  useEffect(
    () => () => {
      if (audio.current) {
        audio.current.onended = null
        audio.current.pause()
        audio.current = null
      }
    },
    []
  )

  const stopPreview = () => {
    if (audio.current) {
      audio.current.onended = null
      audio.current.pause()
      audio.current = null
    }
    setPlaying(false)
  }
  const preview = async () => {
    if (playing) {
      stopPreview()
      return
    }
    if (!selected?.audioSrc) return
    audio.current?.pause()
    const player = new Audio(selected.audioSrc)
    audio.current = player
    player.playbackRate = settings.speaking_rate
    player.onended = () => setPlaying(false)
    try {
      await player.play()
      if (audio.current === player) setPlaying(true)
    } catch {
      if (audio.current !== player) return
      setPlaying(false)
      addToast('The voice preview could not be played.', 'error')
    }
  }

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
              onChange={speaking_rate => {
                updateSettings({ speaking_rate })
                if (audio.current) audio.current.playbackRate = speaking_rate
              }}
            />
          </div>
        </FormRow>
      </FormGroup>
      <FormGroup title="Voice" sub="Choose a default voice for this session">
        {voices.length ? (
          <Radio
            name={`${id}-voice`}
            label="Default voice"
            presentation="card"
            value={settings.voice}
            onChange={voice => {
              stopPreview()
              updateSettings({ voice })
            }}
            options={voices.map(voice => ({
              value: voice.id,
              label: <VoiceOption voice={voice} />,
            }))}
          />
        ) : (
          <p className="text-[12.5px] text-[var(--fg-4)] py-2">No voices available.</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm" disabled={!selected?.audioSrc} onClick={() => void preview()}>
            {playing ? 'Stop preview' : 'Preview voice'}
          </Button>
          {!selected?.audioSrc && (
            <p className="text-xs text-[var(--fg-4)]">
              Select a voice with a preview recording to listen.
            </p>
          )}
        </div>
      </FormGroup>
    </>
  )
}
