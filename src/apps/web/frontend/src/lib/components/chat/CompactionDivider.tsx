import Button from '$components/buttons/Button'
import { useState } from 'react'
import MS from '$components/display/MS'
import { MarkdownMessage } from '$components'
import type { CompactionDividerProps } from '$types/widgets/chat-shell'

export default function CompactionDivider({ summaryContent, onCopy }: CompactionDividerProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="my-4">
      <div className="flex items-center gap-3 text-textSecondary text-sm">
        <div className="flex-1 h-px bg-border" />
        <Button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 hover:text-text transition-colors duration-200 cursor-pointer"
          aria-label={expanded ? 'Collapse summary' : 'Expand summary'}
        >
          <MS name="compress" size={14} />
          <span>Earlier messages were summarized</span>
          {summaryContent && (
            <MS
              name="expand_more"
              size={16}
              style={{
                transition: 'transform 0.2s',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          )}
        </Button>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Opened on request inside the chat's live log, which would otherwise read it all out. */}
      {expanded && summaryContent && (
        <div
          aria-live="off"
          className="mt-3 p-4 rounded-xl bg-[color-mix(in_srgb,var(--bg-surface)_30%,transparent)] text-sm max-h-64 overflow-y-auto"
        >
          <MarkdownMessage content={summaryContent} onCopy={onCopy} />
        </div>
      )}
    </div>
  )
}
