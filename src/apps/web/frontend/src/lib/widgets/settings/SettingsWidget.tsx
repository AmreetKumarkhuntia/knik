import { useEffect } from 'react'
import { useViewport } from '$hooks'
import { useSettingsScope } from '$stores/settings'
import VerticalTabs from '$components/navigation/VerticalTabs'
import SectionHeader from '$components/display/SectionHeader'
import GeneralPane from './GeneralPane'
import AppearancePane from './AppearancePane'
import ProvidersPane from './ProvidersPane'
import VoicePane from './VoicePane'
import KeysPane from './KeysPane'
import type { SettingsWidgetProps } from '$types/widgets/settings'

export default function SettingsWidget({
  requestedTab,
  onRequestedTabApplied,
}: SettingsWidgetProps) {
  const { scope, patch } = useSettingsScope()
  const viewport = useViewport()
  const tabs = [
    { id: 'general', label: 'General', icon: 'tune', content: <GeneralPane /> },
    { id: 'appearance', label: 'Appearance', icon: 'palette', content: <AppearancePane /> },
    { id: 'providers', label: 'Providers', icon: 'hub', content: <ProvidersPane /> },
    { id: 'voice', label: 'Voice', icon: 'graphic_eq', content: <VoicePane /> },
    { id: 'keys', label: 'API keys', icon: 'key', content: <KeysPane /> },
  ]
  const requestedPane = tabs.some(tab => tab.id === requestedTab) ? requestedTab : null
  useEffect(() => {
    if (!requestedPane) return
    patch({ tab: requestedPane })
    onRequestedTabApplied?.()
  }, [requestedPane, patch, onRequestedTabApplied])
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="mx-auto max-w-[1032px] px-4 py-6 pb-12 sm:px-8">
        <SectionHeader
          className="mb-6"
          title="Settings"
          subtitle="Workspace preferences and account"
        />
        <VerticalTabs
          tabs={tabs}
          activeTab={scope.tab}
          onChange={tab => patch({ tab })}
          orientation={viewport === 'mobile' ? 'horizontal' : 'vertical'}
        />
      </div>
    </div>
  )
}
