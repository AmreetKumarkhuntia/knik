import { useState } from 'react'
import { ExpandMore, Compress } from '@mui/icons-material'
import { MarkdownMessage } from '$components/MarkdownMessage'

interface CompactionDividerProps {
  summaryContent?: string
}

export default function CompactionDivider({ summaryContent }: CompactionDividerProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="my-4">
      <div className="flex items-center gap-3 text-textSecondary text-sm">
        <div className="flex-1 h-px bg-border" />
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 hover:text-text transition-colors duration-200 cursor-pointer"
          aria-label={expanded ? 'Collapse summary' : 'Expand summary'}
        >
          <Compress style={{ fontSize: 14 }} />
          <span>Earlier messages were summarized</span>
          {summaryContent && (
            <ExpandMore
              style={{
                fontSize: 16,
                transition: 'transform 0.2s',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          )}
        </button>
        <div className="flex-1 h-px bg-border" />
      </div>

      {expanded && summaryContent && (
        <div className="mt-3 p-4 rounded-xl bg-surface/30 text-sm max-h-64 overflow-y-auto">
          <MarkdownMessage content={summaryContent} />
        </div>
      )}
    </div>
  )
}
