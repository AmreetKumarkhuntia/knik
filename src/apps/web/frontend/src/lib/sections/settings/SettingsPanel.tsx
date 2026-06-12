import React from 'react'
import VerticalTabs from '../../components/VerticalTabs'
import ToggleSwitch from '../../components/ToggleSwitch'
import Select from '../../components/Select'

export interface SettingsSection {
  id: string
  label: string
  icon: string
  content: React.ReactNode
}

export interface SettingsPanelProps {
  sections?: SettingsSection[]
  className?: string
}

export default function SettingsPanel({ sections, className = '' }: SettingsPanelProps) {
  // Default dummy sections if none provided
  const defaultSections: SettingsSection[] = [
    {
      id: 'general',
      label: 'General',
      icon: 'settings',
      content: (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h3 className="heading-4 mb-4">General Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 knik-card">
                <div>
                  <div className="font-medium text-fg-1">Dark Mode</div>
                  <div className="text-sm text-fg-3">Use dark theme across the application</div>
                </div>
                <ToggleSwitch checked={true} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between p-4 knik-card">
                <div>
                  <div className="font-medium text-fg-1">Animations</div>
                  <div className="text-sm text-fg-3">Enable rich UI animations and transitions</div>
                </div>
                <ToggleSwitch checked={true} onChange={() => {}} />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'models',
      label: 'Models',
      icon: 'smart_toy',
      content: (
        <div className="space-y-6 max-w-2xl">
          <h3 className="heading-4 mb-4">Model Configuration</h3>
          <div className="space-y-4">
            <div className="p-4 knik-card space-y-3">
              <label className="block text-sm font-medium text-fg-2">Default Chat Model</label>
              <Select
                options={[
                  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
                  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
                ]}
                value="gemini-1.5-pro"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      ),
    },
  ]

  const activeSections = sections || defaultSections

  return (
    <div className={`p-6 h-full ${className}`}>
      <div className="max-w-5xl mx-auto h-full flex flex-col">
        <h1 className="heading-2 mb-8">Settings</h1>
        <div className="flex-1 min-h-0 bg-surface rounded-xl border border-border-1 p-6">
          <VerticalTabs tabs={activeSections} />
        </div>
      </div>
    </div>
  )
}
