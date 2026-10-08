import { useId, useState } from 'react'
import type { VerticalTabsProps } from '$types'
import Tabs from './Tabs'
export default function VerticalTabs({
  tabs,
  activeTab: controlled,
  onChange,
  className = '',
}: VerticalTabsProps) {
  const [internal, setInternal] = useState(tabs[0]?.id ?? '')
  const active = controlled ?? internal,
    id = useId()
  return (
    <div className={`flex flex-col md:flex-row gap-6 ${className}`}>
      <Tabs
        tabs={tabs}
        active={active}
        idPrefix={id}
        orientation="vertical"
        variant="pills"
        className="w-full md:w-64 shrink-0"
        onChange={value => {
          setInternal(value)
          onChange?.(value)
        }}
      />
      <div
        role="tabpanel"
        id={`${id}-panel-${active}`}
        aria-labelledby={`${id}-tab-${active}`}
        className="flex-1 min-w-0"
      >
        {tabs.find(tab => tab.id === active)?.content}
      </div>
    </div>
  )
}
