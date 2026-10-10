import { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MS from '../display/MS'
import ToolCallCard from './ToolCallCard'
import Button from '../buttons/Button'
import { ANIMATION } from '$lib/constants/dimensions'
import { TOOL_CALL_KINDS } from '$lib/constants/componentMaps'
import type { ToolCallKind } from '$types/conversation'
import type { ToolCallListProps } from '$types/components/chat'

/** "Used 2 tools · 1 skill", counting each kind that appears. */
function summarizeCalls(calls: ToolCallListProps['calls']) {
  const parts = (Object.keys(TOOL_CALL_KINDS) as ToolCallKind[]).flatMap(kind => {
    const count = calls.filter(call => (call.kind ?? 'tool') === kind).length
    return count ? [`${count} ${TOOL_CALL_KINDS[kind].nouns[count === 1 ? 0 : 1]}`] : []
  })
  return `Used ${parts.join(' · ')}`
}

const SUMMARY_THRESHOLD = 3

/** Stacks a reply's tool calls; a finished reply with many calls folds them behind a summary. */
export default function ToolCallList({ calls, isStreaming, className = '' }: ToolCallListProps) {
  const id = useId()
  const [expanded, setExpanded] = useState(false)
  const collapsible = !isStreaming && calls.length >= SUMMARY_THRESHOLD
  const visible = !collapsible || expanded
  if (!calls.length) return null

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {collapsible && (
        <Button
          variant="ghost"
          size="xs"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(!expanded)}
          className="self-start rounded-full border border-border-2 bg-surface-2 text-caption text-fg-3 hover:text-fg-1"
        >
          <MS name="build" size={14} />
          {summarizeCalls(calls)}
          <motion.span
            aria-hidden="true"
            animate={{ rotate: expanded ? 180 : 0 }}
            className="material-symbols-outlined"
            style={{ fontSize: 14 }}
          >
            expand_more
          </motion.span>
        </Button>
      )}
      {visible && (
        <div id={id} className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {calls.map(call => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: ANIMATION.stiffness,
                  damping: ANIMATION.damping,
                }}
              >
                <ToolCallCard call={call} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
