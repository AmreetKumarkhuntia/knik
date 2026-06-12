import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export interface JsonViewerProps {
  data: any
  tabs?: string[]
  copyable?: boolean
  className?: string
}

export default function JsonViewer({
  data,
  tabs,
  copyable = true,
  className = '',
}: JsonViewerProps) {
  const defaultTab = tabs && tabs.length > 0 ? tabs[0] : ''
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [copied, setCopied] = useState(false)

  // If tabs are provided, assume data is keyed by tab name (e.g. data['Inputs'])
  // Otherwise, just stringify the whole data object
  const displayData =
    tabs && tabs.length > 0 && data && typeof data === 'object' && activeTab in data
      ? data[activeTab]
      : data

  const jsonString = JSON.stringify(displayData, null, 2)

  const handleCopy = () => {
    void navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`rounded-xl overflow-hidden border border-[var(--border-2)] bg-[var(--bg-code)] ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-2 border-b border-[var(--border-2)]">
        <div className="flex gap-0.5">
          {tabs && tabs.length > 0 ? (
            tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs px-2.5 py-1.5 rounded-md cursor-pointer transition-colors duration-fast ${
                  activeTab === tab
                    ? 'bg-surface-3 text-fg-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                    : 'text-fg-3 hover:text-fg-2 hover:bg-[color-mix(in_srgb,var(--bg-surface-3)_50%,transparent)]'
                }`}
              >
                {tab}
              </button>
            ))
          ) : (
            <span className="text-xs text-fg-3 px-2 py-1 font-mono uppercase tracking-wider">
              JSON
            </span>
          )}
        </div>

        {copyable && (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-[11.5px] text-fg-3 bg-transparent border-none cursor-pointer hover:text-fg-1 transition-colors duration-fast"
          >
            <span className="material-symbols-outlined text-[14px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      {/* Code Body */}
      <div className="text-[12.5px] leading-relaxed tracking-mono max-h-[300px] overflow-auto">
        <SyntaxHighlighter
          language="json"
          style={vscDarkPlus}
          showLineNumbers={true}
          customStyle={{
            margin: 0,
            padding: '14px 16px',
            background: 'transparent',
            fontFamily: 'var(--font-mono)',
          }}
          lineNumberStyle={{
            minWidth: '28px',
            paddingRight: '14px',
            color: 'var(--fg-5)',
            textAlign: 'right',
            userSelect: 'none',
          }}
        >
          {jsonString}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
