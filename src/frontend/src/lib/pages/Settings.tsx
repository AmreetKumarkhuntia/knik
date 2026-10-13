import { useSearchParams } from 'react-router-dom'
import SettingsWidget from '$widgets/settings/SettingsWidget'
import { SETTINGS_TAB_PARAM } from '$lib/constants/navigation'

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams()
  return (
    <SettingsWidget
      requestedTab={searchParams.get(SETTINGS_TAB_PARAM)}
      onRequestedTabApplied={() => setSearchParams({}, { replace: true })}
    />
  )
}
