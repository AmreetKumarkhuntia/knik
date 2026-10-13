import Button from '$components/buttons/Button'
import { useState } from 'react'
import MS from '$components/display/MS'
import { MarkdownMessage } from '$components'
import type { CompactionDividerProps } from '$types/widgets/chat-shell'

export default function CompactionDivider({ summaryContent, onCopy }: CompactionDividerProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="my-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border-1" />
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setExpanded(!expanded)}
          className="knik-btn--compact px-2.5 gap-1.5 rounded-[9px] text-label text-fg-3 hover:!text-fg-1"
          aria-label={expanded ? 'Collapse summary' : 'Expand summary'}
        >
          <MS name="compress" size={15} />
          <span>Earlier messages were summarized</span>
          {summaryContent && (
            <MS
              name="expand_more"
              size={16}
              className={`transition-transform duration-slow ease-spring ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </Button>
        <div className="flex-1 h-px bg-border-1" />
      </div>

      {/* Opened on request inside the chat's live log, which would otherwise read it all out. */}
      {expanded && summaryContent && (
        <div
          aria-live="off"
          className="mt-3 p-4 rounded-[14px] border border-border-1 bg-[color-mix(in_srgb,var(--bg-surface)_30%,transparent)] text-body max-h-64 overflow-y-auto"
        >
          <MarkdownMessage content={summaryContent} onCopy={onCopy} />
        </div>
      )}
    </div>
  )
}
