import { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MS from '../display/MS'
import JsonViewer from './JsonViewer'
import Button from '../buttons/Button'
import { formatDuration } from '$utils/format'
import { TOOL_CALL_KINDS, TOOL_CALL_STATUS_LABELS } from '$lib/constants/componentMaps'
import type { ToolCallStatus } from '$types/conversation'
import type { ToolCallCardProps } from '$types/components/chat'

function StatusIcon({ status }: { status: ToolCallStatus }) {
  if (status === 'running')
    return (
      <span
        aria-hidden="true"
        className="knik-spinner knik-spinner--sm"
        style={{ color: 'var(--primary)' }}
      />
    )
  return status === 'success' ? (
    <MS name="check" size={14} style={{ color: 'var(--success)' }} />
  ) : (
    <MS name="error" size={14} style={{ color: 'var(--danger)' }} />
  )
}

/** One tool, skill or MCP call as a plain row; clicking it shows the call's inputs and outputs. */
export default function ToolCallCard({ call, defaultExpanded, className = '' }: ToolCallCardProps) {
  const id = useId()
  const status = call.status ?? 'success'
  const kind = TOOL_CALL_KINDS[call.kind ?? 'tool']
  const [expanded, setExpanded] = useState(defaultExpanded ?? status === 'error')
  // A call that fails while visible opens on its own, the same as one that failed before mount.
  const [seenStatus, setSeenStatus] = useState(status)
  if (seenStatus !== status) {
    setSeenStatus(status)
    if (status === 'error') setExpanded(true)
  }
  const tabs = status === 'success' ? ['Outputs', 'Inputs'] : ['Inputs']

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="xs"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded(!expanded)}
        className="w-full text-label text-fg-3 hover:text-fg-1"
      >
        <span className="flex-1 min-w-0 flex items-center gap-2 text-left">
          <MS name={kind.icon} size={14} className="shrink-0" />
          <span
            className={`font-mono text-mono-sm truncate min-w-0 ${status === 'running' ? 'knik-shimmer-text' : ''}`}
          >
            {call.tool_name}
          </span>
          <span className="text-caption text-fg-4 shrink-0">{kind.label}</span>
          <span className="ml-auto flex items-center gap-2 shrink-0">
            {call.duration_ms !== undefined && status !== 'running' && (
              <span className="text-caption text-fg-4">{formatDuration(call.duration_ms)}</span>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={status}
                className="inline-flex"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <StatusIcon status={status} />
              </motion.span>
            </AnimatePresence>
            <span className="sr-only">{TOOL_CALL_STATUS_LABELS[status]}</span>
            <motion.span
              aria-hidden="true"
              animate={{ rotate: expanded ? 180 : 0 }}
              className="material-symbols-outlined text-fg-4"
              style={{ fontSize: 16 }}
            >
              expand_more
            </motion.span>
          </span>
        </span>
      </Button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={id}
            aria-live="off"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 pt-1 pb-2">
              {status === 'error' && (
                <p
                  className="m-0 rounded-md px-3 py-2 font-mono text-mono-sm whitespace-pre-wrap"
                  style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                >
                  {call.error || 'The call failed.'}
                </p>
              )}
              <JsonViewer
                data={{ Inputs: call.tool_args, Outputs: call.tool_result }}
                tabs={tabs}
                copyable={false}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
