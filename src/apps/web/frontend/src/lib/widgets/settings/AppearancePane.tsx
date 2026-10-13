import { useId } from 'react'
import MS from '$components/display/MS'
import Radio from '$components/forms/Radio'
import FormGroup from '$widgets/FormGroup'
import FormRow from '$widgets/FormRow'
import type { ThemeMode } from '$types/theme'
import { useSettingsStore } from '$stores/settings'

export default function AppearancePane() {
  const id = useId()
  const hintId = `${id}-theme-hint`
  const mode = useSettingsStore(state => state.appearance.mode)
  const updateAppearance = useSettingsStore(state => state.updateAppearance)
  return (
    <FormGroup
      title="Appearance"
      sub="Choose the color mode for your workspace"
      bodyClassName="px-[18px]"
    >
      <FormRow label="Color mode" hint="Changes last for this session" hintId={hintId} last>
        <Radio
          name={`${id}-theme`}
          label="Color mode"
          hideLabel
          aria-describedby={hintId}
          presentation="segmented"
          value={mode}
          onChange={mode => updateAppearance({ mode: mode as ThemeMode })}
          options={[
            {
              value: 'dark',
              label: (
                <>
                  <MS name="dark_mode" size={16} />
                  Dark
                </>
              ),
            },
            {
              value: 'light',
              label: (
                <>
                  <MS name="light_mode" size={16} />
                  Light
                </>
              ),
            },
          ]}
        />
      </FormRow>
    </FormGroup>
  )
}
