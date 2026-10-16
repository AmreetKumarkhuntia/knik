import ToolGroupList from '$components/settings/ToolGroupList'
import FormGroup from '$widgets/FormGroup'
import { useSettingsStore } from '$stores/settings'
import { useProvidersView } from '$stores/views'

export default function ProvidersPane() {
  const { tools } = useProvidersView()
  const toggleTool = useSettingsStore(s => s.toggleTool)
  return (
    <FormGroup title="MCP tools" sub="Choose the tool groups enabled in this session">
      <ToolGroupList groups={tools} onToggle={toggleTool} />
    </FormGroup>
  )
}
