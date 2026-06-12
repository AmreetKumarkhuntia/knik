import React from 'react'
import { motion } from 'framer-motion'

export interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: React.ReactNode
  timestamp?: string
  actions?: {
    copy?: () => void
    thumbsUp?: () => void
    retry?: () => void
  }
  className?: string
}

export default function ChatBubble({
  role,
  content,
  timestamp,
  actions,
  className = '',
}: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: 'easeOut', duration: 0.3 }}
      className={`flex gap-3 max-w-[84%] ${isUser ? 'ml-auto flex-row-reverse' : ''} ${className}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-surface-3 text-fg-2 font-mono text-[11px] font-semibold'
            : 'bg-gradient-to-br from-aurora-500/20 to-teal-500/20 text-aurora-300 border border-aurora-400/30'
        }`}
      >
        {isUser ? 'US' : <span className="material-symbols-outlined text-[14px]">smart_toy</span>}
      </div>

      {/* Message Body */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`text-[14.5px] leading-relaxed px-4 py-2.5 rounded-2xl ${
            isUser
              ? 'bg-[var(--primary-soft)] text-fg-1 rounded-tr-sm'
              : 'bg-surface-2 text-fg-2 rounded-tl-sm'
          }`}
        >
          {content}
        </div>

        {/* Footer (Actions + Timestamp) */}
        <div className={`flex items-center gap-2 mt-1.5 ${isUser ? 'flex-row-reverse' : ''}`}>
          {actions && !isUser && (
            <div className="flex gap-1">
              {actions.copy && (
                <button
                  onClick={actions.copy}
                  className="w-6 h-6 rounded-md text-fg-4 inline-flex items-center justify-center hover:bg-surface-3 hover:text-fg-1 transition-colors duration-fast"
                  title="Copy"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                </button>
              )}
              {actions.thumbsUp && (
                <button
                  onClick={actions.thumbsUp}
                  className="w-6 h-6 rounded-md text-fg-4 inline-flex items-center justify-center hover:bg-surface-3 hover:text-fg-1 transition-colors duration-fast"
                  title="Thumbs Up"
                >
                  <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                </button>
              )}
              {actions.retry && (
                <button
                  onClick={actions.retry}
                  className="w-6 h-6 rounded-md text-fg-4 inline-flex items-center justify-center hover:bg-surface-3 hover:text-fg-1 transition-colors duration-fast"
                  title="Retry"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                </button>
              )}
            </div>
          )}
          {timestamp && <span className="text-xs text-fg-4 font-mono">{timestamp}</span>}
        </div>
      </div>
    </motion.div>
  )
}
