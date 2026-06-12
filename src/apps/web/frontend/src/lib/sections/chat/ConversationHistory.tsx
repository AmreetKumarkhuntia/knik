import React from 'react'
import { DEFAULT_CONVERSATIONS } from '$constants/demoData'

export interface Conversation {
  id: string
  name: string
  time: string
  group: string
  tag: string
  preview: string
  active?: boolean
}

export interface ConversationHistoryProps {
  conversations?: Conversation[]
  onSelect: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}

export default function ConversationHistory({
  conversations = DEFAULT_CONVERSATIONS,
  onSelect,
  onDelete,
  className = '',
}: ConversationHistoryProps) {
  const groups = conversations.reduce(
    (acc, curr) => {
      if (!acc[curr.group]) acc[curr.group] = []
      acc[curr.group].push(curr)
      return acc
    },
    {} as Record<string, Conversation[]>
  )

  return (
    <div className={`flex flex-col ${className}`}>
      {Object.entries(groups).map(([groupName, items], gIdx) => (
        <React.Fragment key={groupName}>
          <div
            className={`font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--fg-4)] mb-2 ${gIdx > 0 ? 'mt-4' : 'm-0'}`}
          >
            {groupName}
          </div>
          <div className="flex flex-col gap-[2px]">
            {items.map(conv => (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`
                  flex flex-col gap-[3px] px-3 py-2.5 rounded-md cursor-pointer transition-colors group
                  ${
                    conv.active
                      ? 'bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_25%,transparent)]'
                      : 'hover:bg-[var(--bg-surface-2)]'
                  }
                `}
              >
                <div className="flex justify-between items-center gap-2">
                  <span
                    className={`text-[13.5px] font-medium tracking-tight truncate flex-1 min-w-0 ${conv.active ? 'text-[var(--aurora-200)]' : 'text-[var(--fg-1)]'}`}
                  >
                    {conv.name}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--fg-5)] shrink-0 group-hover:hidden">
                    {conv.time}
                  </span>
                  {onDelete && (
                    <span
                      onClick={e => {
                        e.stopPropagation()
                        onDelete(conv.id)
                      }}
                      className="hidden group-hover:flex material-symbols-outlined text-[14px] text-[var(--fg-4)] hover:text-[var(--danger)] shrink-0"
                    >
                      delete
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-[var(--fg-4)] leading-[1.4] truncate">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--aurora-300)] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] border border-[color-mix(in_srgb,var(--primary)_20%,transparent)] px-1.5 py-[1px] rounded-xs">
                    {conv.tag}
                  </span>
                  &nbsp;{conv.preview}
                </div>
              </div>
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}
