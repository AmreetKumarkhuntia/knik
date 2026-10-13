import { useId, useState } from 'react'
import type { VerticalTabsProps } from '$types'
import Tabs from './Tabs'

export default function VerticalTabs({
  tabs,
  activeTab: controlled,
  onChange,
  orientation = 'vertical',
  className = '',
}: VerticalTabsProps) {
  const [internal, setInternal] = useState(tabs[0]?.id ?? '')
  const active = controlled ?? internal,
    id = useId()
  return (
    <div className={`flex min-w-0 flex-col gap-6 md:flex-row md:gap-7 ${className}`}>
      <Tabs
        tabs={tabs}
        active={active}
        idPrefix={id}
        orientation={orientation}
        variant="pills"
        className="w-full shrink-0 overflow-x-auto md:sticky md:top-0 md:w-[200px] md:self-start md:overflow-visible"
        onChange={value => {
          setInternal(value)
          onChange?.(value)
        }}
      />
      <div
        role="tabpanel"
        id={`${id}-panel-${active}`}
        aria-labelledby={`${id}-tab-${active}`}
        className="min-w-0 flex-1 md:max-w-[760px]"
      >
        {tabs.find(tab => tab.id === active)?.content}
      </div>
    </div>
  )
}
