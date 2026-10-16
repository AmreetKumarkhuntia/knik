import { useEffect, type ReactNode } from 'react'
import { useViewport } from '$hooks'
import { useSettingsScope } from '$stores/settings'
import VerticalTabs from '$components/navigation/VerticalTabs'
import SectionHeader from '$components/display/SectionHeader'
import RemoteSettingsPane from './RemoteSettingsPane'
import GeneralPane from './GeneralPane'
import AppearancePane from './AppearancePane'
import ProvidersPane from './ProvidersPane'
import KeysPane from './KeysPane'
import type { SettingsWidgetProps } from '$types/widgets/settings'

export default function SettingsWidget({
  requestedTab,
  onRequestedTabApplied,
}: SettingsWidgetProps) {
  const { scope, patch } = useSettingsScope()
  const viewport = useViewport()
  // A distinct key per pane remounts the wrapper so the entrance replays on every tab switch.
  const pane = (id: string, content: ReactNode) => (
    <div key={id} className="flex flex-col gap-6 knik-enter-rise">
      {content}
    </div>
  )
  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: 'tune',
      content: pane(
        'general',
        <>
          <RemoteSettingsPane />
          <GeneralPane />
        </>
      ),
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: 'palette',
      content: pane('appearance', <AppearancePane />),
    },
    {
      id: 'providers',
      label: 'Providers',
      icon: 'hub',
      content: pane('providers', <ProvidersPane />),
    },
    { id: 'keys', label: 'API keys', icon: 'key', content: pane('keys', <KeysPane />) },
  ]
  const requestedPane = tabs.some(tab => tab.id === requestedTab) ? requestedTab : null
  useEffect(() => {
    if (!requestedPane) return
    patch({ tab: requestedPane })
    onRequestedTabApplied?.()
  }, [requestedPane, patch, onRequestedTabApplied])
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="mx-auto max-w-[1032px] px-4 pb-12 pt-6 sm:px-8">
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
