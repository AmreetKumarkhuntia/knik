import Button from '../buttons/Button'
import MS from '../display/MS'
import { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AgentThinkingStep, AgentThinkingProps } from '$types'

export default function AgentThinking({
  steps,
  defaultExpanded = false,
  className = '',
}: AgentThinkingProps) {
  const id = useId()
  const [expanded, setExpanded] = useState(defaultExpanded)

  const renderStep = (step: AgentThinkingStep, i: number) => {
    if (step.type === 'thinking') {
      return (
        <div key={i} className="text-sm text-fg-3 leading-relaxed px-2 py-1">
          {step.content}
        </div>
      )
    }

    if (step.type === 'tool_call') {
      return (
        <div
          key={i}
          className="flex items-center gap-2.5 px-3 py-2.5 bg-surface-2 border border-border-2 rounded-[10px] text-[13px] text-fg-2"
        >
          <span className="w-[22px] h-[22px] rounded-full inline-flex items-center justify-center bg-emerald-500/15 text-emerald-500 shrink-0">
            <MS name="check" size={14} />
          </span>
          <span className="font-mono text-[11.5px]">{step.content}</span>
        </div>
      )
    }

    const lines = step.content.split('\n')
    return (
      <div
        key={i}
        className="border border-border-2 rounded-[10px] overflow-hidden font-mono text-[12px]"
      >
        {lines.map((line, idx) => {
          const isAdd = line.startsWith('+')
          const isRm = line.startsWith('-')
          let lineClass = 'text-fg-3 px-3 py-0.5'
          if (isAdd) lineClass = 'bg-emerald-500/10 text-emerald-400 px-3 py-0.5'
          if (isRm) lineClass = 'bg-red-500/10 text-red-400 px-3 py-0.5'

          return (
            <div key={idx} className={lineClass}>
              {line}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      {/* Compaction divider toggle */}
      <Button
        variant="ghost"
        aria-expanded={expanded}
        aria-controls={id}
        className="w-full flex items-center gap-3 text-[12px] text-fg-4 cursor-pointer group select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 h-px bg-border-2 group-hover:bg-border-3 transition-colors" />
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-dashed border-border-2 rounded-full bg-surface-2 text-fg-3 font-sans group-hover:text-fg-1 group-hover:border-border-3 transition-colors">
          <MS name={expanded ? 'unfold_less' : 'compress'} size={13} />
          Thinking trace
          <motion.span
            aria-hidden="true"
            animate={{ rotate: expanded ? 180 : 0 }}
            className="material-symbols-outlined text-[14px]"
          >
            expand_more
          </motion.span>
        </span>
        <div className="flex-1 h-px bg-border-2 group-hover:bg-border-3 transition-colors" />
      </Button>

      <AnimatePresence initial={false}>
        {expanded && (
          // Opened on request inside the chat's live log, which would otherwise read it all out.
          <motion.div
            id={id}
            aria-live="off"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
            className="overflow-hidden flex flex-col gap-3"
          >
            {steps.map((step, i) => renderStep(step, i))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
