import { useState, useEffect } from 'react'
import { ToggleSwitch, Slider, MS } from '$components'
import { FormGroup, FormRow } from '$widgets'
import { ApiClient } from '$services/api'
import type { AdminOption, SettingsPaneProps } from '$types/sections/settings'

/** Text-to-speech settings: enable, rate, and voice selection. */
export default function VoicePane({ settings, onUpdate }: SettingsPaneProps) {
  const [voices, setVoices] = useState<AdminOption[]>([])
  const [rate, setRate] = useState(1)
  const [ttsEnabled, setTtsEnabled] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        setVoices((await ApiClient.admin.getVoices()).voices)
      } catch (e) {
        console.error('Failed to load voices:', e)
      }
    })()
  }, [])

  const sel = settings?.voice ?? ''

  return (
    <>
      <FormGroup title="Text-to-speech" sub="Powered by Kokoro-82M · 9 voices · 10 languages">
        <FormRow label="Enable TTS" hint="Read assistant replies aloud">
          <ToggleSwitch checked={ttsEnabled} onChange={setTtsEnabled} />
        </FormRow>
        <FormRow label="Speaking rate" last>
          <div className="flex items-center" style={{ gap: 10, minWidth: 220 }}>
            <Slider
              min={0.5}
              max={2}
              step={0.1}
              value={rate}
              onChange={setRate}
              className="flex-1"
            />
            <code className="font-mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>
              {rate.toFixed(1)}×
            </code>
          </div>
        </FormRow>
      </FormGroup>

      <FormGroup title="Voice" sub="Default voice for synthesis">
        <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: 10 }}>
          {voices.map(v => {
            const on = sel === v.id
            const female = v.id.startsWith('af_')
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => void onUpdate({ voice: v.id })}
                className="text-left transition-all duration-150 ease-knik-out"
                style={{
                  padding: '12px 13px',
                  borderRadius: 'var(--r-btn, 10px)',
                  cursor: 'pointer',
                  border: `1.5px solid ${on ? 'var(--acc, var(--aurora-400))' : 'var(--border-2)'}`,
                  background: on ? 'var(--acc-soft)' : 'var(--bg-surface)',
                }}
              >
                <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
                  <span
                    className="flex items-center justify-center"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: female ? 'rgba(139,92,246,0.16)' : 'var(--acc-soft)',
                      color: female ? 'var(--violet-400)' : 'var(--acc-text, var(--aurora-300))',
                    }}
                  >
                    <MS name="graphic_eq" size={16} />
                  </span>
                  {on && (
                    <MS
                      name="check_circle"
                      size={16}
                      fill={1}
                      style={{ color: 'var(--acc-text, var(--aurora-300))', marginLeft: 'auto' }}
                    />
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>{v.name}</div>
                <code className="font-mono" style={{ fontSize: 10.5, color: 'var(--fg-4)' }}>
                  {v.id}
                </code>
              </button>
            )
          })}
        </div>
      </FormGroup>
    </>
  )
}
