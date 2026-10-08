import { useId } from 'react'
import Checkbox from '$components/forms/Checkbox'
import Radio from '$components/forms/Radio'
import MS from '$components/display/MS'
import FormGroup from '$widgets/FormGroup'
import { useDemoSession } from '../session/useDemoSession'
import { useSettingsCatalog } from '../session/useSettingsCatalog'

export default function ProvidersPane() {
  const id = useId()
  const providers = useSettingsCatalog('providers')
  const provider = useDemoSession(s => s.settings.provider)
  const tools = useSettingsCatalog('tools')
  const updateSettings = useDemoSession(s => s.updateSettings)
  const toggleTool = useDemoSession(s => s.toggleTool)
  return (
    <>
      <FormGroup title="AI providers" sub="Choose a default provider for this session">
        {providers.length ? (
          <Radio
            name={`${id}-provider`}
            label="Default provider"
            presentation="card"
            value={provider}
            onChange={next => updateSettings({ provider: next })}
            options={providers.map(option => ({
              value: option.id,
              label: option.name,
              monoLabel: option.id === provider ? 'Selected' : 'Available',
            }))}
          />
        ) : (
          <p className="text-[12.5px] text-[var(--fg-4)] py-2">No providers available.</p>
        )}
      </FormGroup>
      <FormGroup title="MCP tools" sub="Choose the tool groups enabled in this session">
        <div className="flex flex-wrap gap-2">
          {tools.map(tool => (
            <Checkbox
              key={tool.name}
              presentation="chip"
              checked={tool.enabled}
              onChange={enabled => toggleTool(tool.name, enabled)}
              label={
                <span className="inline-flex items-center gap-1.5">
                  <MS name="extension" size={14} />
                  <span>{tool.name}</span>
                  <span className="font-mono text-[10px]">{tool.count}</span>
                </span>
              }
            />
          ))}
          {tools.length === 0 && (
            <p className="text-[12.5px] text-[var(--fg-4)] py-2">No tool groups available.</p>
          )}
        </div>
      </FormGroup>
    </>
  )
}
