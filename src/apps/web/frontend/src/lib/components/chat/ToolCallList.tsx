import { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MS from '../display/MS'
import ToolCallCard from './ToolCallCard'
import Button from '../buttons/Button'
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

/** A reply's tool calls behind one line: "Thinking…" until it answers, then a summary that expands. */
export default function ToolCallList({ calls, isThinking, className = '' }: ToolCallListProps) {
  const id = useId()
  const [expanded, setExpanded] = useState(false)
  if (!calls.length)
    return isThinking ? (
      <span className={`flex items-center gap-2 text-label knik-shimmer-text ${className}`}>
        Thinking…
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
        className="self-start -ml-2 text-label text-fg-3 hover:text-fg-1"
      >
        {live ? (
          <span
            aria-hidden="true"
            className="knik-spinner"
            style={{ width: 12, height: 12, color: 'var(--primary)' }}
          />
        ) : (
          <MS name="build" size={14} />
        )}
        <span className={live ? 'knik-shimmer-text' : undefined}>{label}</span>
        {failed > 0 && !live && (
          // Leading space keeps the accessible name readable; flex gap handles the visual spacing.
          <span style={{ color: 'var(--danger)' }}>{` · ${failed} failed`}</span>
        )}
        <motion.span
          aria-hidden="true"
          animate={{ rotate: expanded ? 180 : 0 }}
          className="material-symbols-outlined"
          style={{ fontSize: 16 }}
        >
          expand_more
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
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
            className="overflow-hidden"
          >
            <ol className="m-0 mt-1 ml-1.5 list-none border-l border-border-2 pl-3 flex flex-col">
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
