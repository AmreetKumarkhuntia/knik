import { useId } from 'react'
import ToolGroupList from '$components/settings/ToolGroupList'
import Radio from '$components/forms/Radio'
import FormGroup from '$widgets/FormGroup'
import { useSettingsStore } from '$stores/settings'
import { useProvidersView } from '$stores/views'

export default function ProvidersPane() {
  const id = useId()
  const { providers, provider, tools } = useProvidersView()
  const updateSettings = useSettingsStore(s => s.updateSettings)
  const toggleTool = useSettingsStore(s => s.toggleTool)
  return (
    <>
      <FormGroup
        title="AI providers"
        sub="Choose a default provider for this session"
        bodyClassName="p-1.5"
      >
        {providers.length ? (
          <Radio
            name={`${id}-provider`}
            label="Default provider"
            hideLabel
            presentation="card"
            value={provider}
            onChange={next => updateSettings({ provider: next })}
            options={providers.map(option => ({ ...option, monoLabel: option.value }))}
          />
        ) : (
          <p className="px-3 py-2.5 text-body-sm text-fg-4">No providers available.</p>
        )}
      </FormGroup>
      <FormGroup title="MCP tools" sub="Choose the tool groups enabled in this session">
        <ToolGroupList groups={tools} onToggle={toggleTool} />
      </FormGroup>
    </>
  )
}
