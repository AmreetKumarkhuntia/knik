import type * as React from 'react'

/** A single section in the settings panel (vertical-tabs driven). */
export interface SettingsSection {
  id: string
  label: string
  icon: string
  content: React.ReactNode
}

/** Props for the settings panel. */
export interface SettingsPanelProps {
  sections?: SettingsSection[]
  className?: string
}
