import React, { useState } from 'react'

export interface VerticalTab {
  id: string
  label: string
  icon?: string
  content: React.ReactNode
}

export interface VerticalTabsProps {
  tabs: VerticalTab[]
  activeTab?: string
  onChange?: (id: string) => void
  className?: string
}

export default function VerticalTabs({
  tabs,
  activeTab: externalActiveTab,
  onChange,
  className = '',
}: VerticalTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id || '')

  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab

  const handleTabClick = (id: string) => {
    setInternalActiveTab(id)
    onChange?.(id)
  }

  const activeContent = tabs.find(t => t.id === activeTab)?.content

  return (
    <div className={`flex flex-col md:flex-row gap-6 ${className}`}>
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-1">
        {tabs.map(tab => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-fg-2 hover:bg-surface-3 hover:text-fg-1'
                }
              `}
            >
              {tab.icon && (
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              )}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1">{activeContent}</div>
    </div>
  )
}
