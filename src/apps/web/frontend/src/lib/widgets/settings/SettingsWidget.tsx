import VerticalTabs from '$components/navigation/VerticalTabs'
import SectionHeader from '$components/display/SectionHeader'
import GeneralPane from './GeneralPane'
import AppearancePane from './AppearancePane'
import ProvidersPane from './ProvidersPane'
import VoicePane from './VoicePane'
import KeysPane from './KeysPane'

export default function SettingsWidget() {
  const tabs = [
    { id: 'general', label: 'General', icon: 'tune', content: <GeneralPane /> },
    { id: 'appearance', label: 'Appearance', icon: 'palette', content: <AppearancePane /> },
    { id: 'providers', label: 'Providers', icon: 'hub', content: <ProvidersPane /> },
    { id: 'voice', label: 'Voice', icon: 'graphic_eq', content: <VoicePane /> },
    { id: 'keys', label: 'API keys', icon: 'key', content: <KeysPane /> },
  ]
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="mx-auto max-w-[920px] px-4 py-7 pb-12 sm:px-8">
        <SectionHeader
          className="mb-7"
          title="Settings"
          subtitle="Manage your workspace, models, and account"
        />
        <VerticalTabs tabs={tabs} />
      </div>
    </div>
  )
}
