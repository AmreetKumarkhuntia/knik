import { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MS from '../display/MS'
import ToolCallCard from './ToolCallCard'
import Button from '../buttons/Button'
import { TOOL_CALL_KINDS } from '$lib/constants/componentMaps'
import { MOTION_DURATION, MOTION_EASE_OUT, MOTION_EASE_SPRING } from '$lib/constants/motion'
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

function LiveSpinner() {
  return (
    <span
      aria-hidden="true"
      className="knik-spinner knik-spinner--xs shrink-0 text-[var(--primary)]"
    />
  )
}

/** A reply's tool calls behind one line: "Thinking…" until it answers, then a summary that expands. */
export default function ToolCallList({ calls, isThinking, className = '' }: ToolCallListProps) {
  const id = useId()
  const [expanded, setExpanded] = useState(false)
  if (!calls.length)
    return isThinking ? (
      <span className={`inline-flex items-center gap-2 min-h-[30px] text-label ${className}`}>
        <LiveSpinner />
        <span className="knik-shimmer-text">Thinking…</span>
      </span>
    ) : null
  const running = calls.find(call => call.status === 'running')
  const failed = calls.filter(call => call.status === 'error').length
  const live = isThinking || running !== undefined
  const label = running
    ? `Running ${running.tool_name}…`
    : isThinking
      ? 'Thinking…'
      : summarizeCalls(calls)

  return (
    <div className={`flex flex-col ${className}`}>
      <Button
        variant="ghost"
        size="xs"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded(!expanded)}
        className="knik-btn--compact self-start -ml-2 pl-2 pr-2.5 gap-2 rounded-[9px] text-label text-fg-3 hover:!text-fg-1"
      >
        {live ? <LiveSpinner /> : <MS name="build" size={15} />}
        <span className={live ? 'knik-shimmer-text' : undefined}>{label}</span>
        {failed > 0 && !live && (
          // Leading space keeps the accessible name readable; flex gap handles the visual spacing.
          <span className="text-[var(--danger)]">{` · ${failed} failed`}</span>
        )}
        <motion.span
          aria-hidden="true"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: MOTION_DURATION.turn, ease: MOTION_EASE_SPRING }}
          className="inline-flex"
        >
          <MS name="expand_more" size={16} />
        </motion.span>
      </Button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={id}
            aria-live="off"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ ease: MOTION_EASE_OUT, duration: MOTION_DURATION.fold }}
            className="overflow-hidden"
          >
            <ol className="mt-1 ml-1.5 pl-3 list-none border-l border-border-2 flex flex-col gap-0.5">
              {calls.map(call => (
                <li key={call.id}>
                  <ToolCallCard call={call} />
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
