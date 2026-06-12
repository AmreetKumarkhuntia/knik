import React, { useState } from 'react'
import { DEFAULT_TOOLS } from '$constants/demoData'

export interface McpTool {
  id: string
  name: string
  desc: string
  category: 'shell' | 'file' | 'browser' | 'cron' | 'text' | string
  icon: string
}

export interface McpToolsPanelProps {
  tools?: McpTool[]
  onToggle?: (id: string) => void
  className?: string
}

const CATEGORY_STYLES: Record<string, string> = {
  shell: 'bg-[color-mix(in_srgb,var(--teal-500)_14%,transparent)] text-[var(--teal-300)]',
  file: 'bg-[color-mix(in_srgb,var(--violet-500)_14%,transparent)] text-[var(--violet-400)]',
  browser: 'bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)]',
  cron: 'bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-[var(--aurora-300)]',
  // No system token for pink; kept as a raw accent for this category.
  text: 'bg-[rgba(236,72,153,0.14)] text-[#ec4899]',
}

export default function McpToolsPanel({
  tools = DEFAULT_TOOLS,
  className = '',
}: McpToolsPanelProps) {
  const [search, setSearch] = useState('')

  const filteredTools = tools.filter(
    t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3.5">
        <div className="text-[13px] text-[var(--fg-3)]">
          <b className="text-[var(--fg-1)] font-semibold">31 MCP tools</b> across 7 categories
        </div>
        <div className="inline-flex items-center gap-1.5 p-[5px_10px] bg-[var(--bg-surface-2)] border border-[var(--border-2)] rounded-[7px] w-[200px] text-[var(--fg-4)] font-mono text-[11.5px] focus-within:border-[var(--aurora-400)] transition-colors">
          <span className="material-symbols-outlined text-[14px]">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="flex-1 bg-transparent border-none outline-none text-[var(--fg-1)] placeholder:text-[var(--fg-4)] min-w-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {filteredTools.map(tool => {
          const style =
            CATEGORY_STYLES[tool.category] ||
            'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--aurora-300)]'

          return (
            <div
              key={tool.id}
              className="flex gap-3 p-3 bg-[var(--bg-surface-2)] border border-[var(--border-2)] rounded-[10px]"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style}`}
              >
                <span className="material-symbols-outlined text-[18px]">{tool.icon}</span>
              </div>
              <div>
                <div className="font-mono text-[13px] font-semibold text-[var(--fg-1)] tracking-[-0.005em]">
                  {tool.name}
                </div>
                <div className="text-[11.5px] text-[var(--fg-3)] leading-snug mt-0.5">
                  {tool.desc}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--fg-4)] p-[2px_6px] border border-[var(--border-2)] rounded mt-1.5 inline-flex">
                  {tool.category}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
