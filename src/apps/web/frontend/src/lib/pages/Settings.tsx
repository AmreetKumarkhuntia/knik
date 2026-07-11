import { useState, useEffect } from 'react'
import { VerticalTabs } from '$components'
import { PaneHeader } from '$widgets'
import { ApiClient } from '$services/api'
import {
  GeneralPane,
  AppearancePane,
  ProvidersPane,
  VoicePane,
  KeysPane,
} from '$sections/settings/panes'
import type { SettingsResponse, SettingsUpdateFn } from '$types/sections/settings'

/** Settings page: General · Appearance · Providers · Voice · API keys. */
export default function Settings() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setSettings(await ApiClient.admin.getSettings())
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    })()
  }, [])

  const onUpdate: SettingsUpdateFn = async patch => {
    setSettings(prev => (prev ? ({ ...prev, ...patch } as SettingsResponse) : prev))
    try {
      await ApiClient.admin.updateSettings(patch)
      setSettings(await ApiClient.admin.getSettings())
    } catch (e) {
      console.error('Failed to update settings:', e)
    }
  }

  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: 'tune',
      content: <GeneralPane settings={settings} onUpdate={onUpdate} />,
    },
    { id: 'appearance', label: 'Appearance', icon: 'palette', content: <AppearancePane /> },
    {
      id: 'providers',
      label: 'Providers',
      icon: 'hub',
      content: <ProvidersPane settings={settings} onUpdate={onUpdate} />,
    },
    {
      id: 'voice',
      label: 'Voice',
      icon: 'graphic_eq',
      content: <VoicePane settings={settings} onUpdate={onUpdate} />,
    },
    { id: 'keys', label: 'API keys', icon: 'key', content: <KeysPane /> },
  ]

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 32px 48px' }}>
        <PaneHeader title="Settings" subtitle="Manage your workspace, models, and account" />
        <VerticalTabs tabs={tabs} />
      </div>
    </div>
  )
}
