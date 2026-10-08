import { useId } from 'react'
import Radio from '$components/forms/Radio'
import ToggleSwitch from '$components/forms/ToggleSwitch'
import ThemePreview from '$components/settings/ThemePreview'
import FormGroup from '$widgets/FormGroup'
import FormRow from '$widgets/FormRow'
import { SETTINGS_ACCENTS } from '$lib/constants/themes'
import type { Radius, ThemeMode, ThemeName } from '$types/theme'
import { useSettingsStore } from '$stores/settings'

export default function AppearancePane() {
  const id = useId()
  const appearance = useSettingsStore(s => s.appearance)
  const updateAppearance = useSettingsStore(s => s.updateAppearance)
  return (
    <>
      <FormGroup title="Theme" sub="Appearance changes last for this session">
        <Radio
          name={`${id}-theme`}
          label="Color mode"
          presentation="card"
          value={appearance.mode}
          onChange={mode => updateAppearance({ mode: mode as ThemeMode })}
          options={[
            { value: 'dark', label: <ThemePreview mode="dark" /> },
            { value: 'light', label: <ThemePreview mode="light" /> },
          ]}
        />
      </FormGroup>
      <FormGroup title="Accent color" sub="Drives buttons, links, and active states">
        <Radio
          name={`${id}-accent`}
          label="Accent color"
          presentation="chip"
          value={appearance.accentName}
          onChange={accentName => updateAppearance({ accentName: accentName as ThemeName })}
          options={SETTINGS_ACCENTS.map(accent => ({
            value: accent.id,
            label: (
              <span className="flex items-center gap-2">
                <span
                  className="w-[18px] h-[18px] rounded-full"
                  style={{ background: accent.color, boxShadow: `0 0 12px -2px ${accent.color}` }}
                />
                {accent.label}
              </span>
            ),
          }))}
        />
      </FormGroup>
      <FormGroup title="Interface">
        <FormRow label="Compact density" hint="Tighter spacing in tables and lists">
          <ToggleSwitch
            aria-label="Compact density"
            checked={appearance.density === 'compact'}
            onChange={compact => updateAppearance({ density: compact ? 'compact' : 'comfortable' })}
          />
        </FormRow>
        <FormRow label="Corners" hint="Corner radius across the app" last>
          <Radio
            name={`${id}-radius`}
            label="Corner radius"
            presentation="segmented"
            value={appearance.radius}
            onChange={radius => updateAppearance({ radius: radius as Radius })}
            options={[
              { value: 'sharp', label: 'Sharp' },
              { value: 'default', label: 'Default' },
              { value: 'round', label: 'Round' },
            ]}
          />
        </FormRow>
      </FormGroup>
    </>
  )
}
