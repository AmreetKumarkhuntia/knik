import { useId, useState } from 'react'
import Tabs from '../navigation/Tabs'
import CodeBlock from './CodeBlock'
import type { JsonViewerProps } from '$types/components/chat'

export default function JsonViewer({
  data,
  tabs,
  copyable = true,
  copied,
  onCopy,
  className = '',
}: JsonViewerProps) {
  const [selectedTab, setSelectedTab] = useState(tabs?.[0] ?? '')
  const activeTab = tabs?.includes(selectedTab) ? selectedTab : (tabs?.[0] ?? '')
  const id = useId()
  const displayData: unknown =
    tabs?.length && data && typeof data === 'object' && activeTab in data
      ? Reflect.get(data, activeTab)
      : data
  const json = displayData === undefined ? undefined : JSON.stringify(displayData, null, 2)

  return (
    <div className={className}>
      {!!tabs?.length && (
        <Tabs
          tabs={tabs.map(tab => ({ id: tab, label: tab }))}
          active={activeTab}
          onChange={setSelectedTab}
          idPrefix={id}
        />
      )}
      <div
        role={tabs?.length ? 'tabpanel' : undefined}
        id={`${id}-panel-${activeTab}`}
        aria-labelledby={tabs?.length ? `${id}-tab-${activeTab}` : undefined}
        tabIndex={tabs?.length ? 0 : undefined}
        className="max-h-[600px] overflow-auto"
      >
        {json === undefined ? (
          <p className="p-4 text-sm text-fg-4">No data supplied.</p>
        ) : (
          <CodeBlock
            code={json}
            language="json"
            showLineNumbers
            copyable={copyable}
            copied={copied}
            onCopy={onCopy}
          />
        )}
      </div>
    </div>
  )
}
