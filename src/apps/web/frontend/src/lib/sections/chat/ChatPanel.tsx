import { motion } from 'framer-motion'
import {
  MarkdownMessage,
  LoadingSpinner,
  KnikGlyph,
  Avatar,
  ActionIcon,
  AgentThinking,
  MS,
} from '$components'
import CompactionDivider from './CompactionDivider'
import { DEMO_ACCOUNT } from '$lib/constants'
import type { AgentThinkingStep } from '$types'
import type { ChatPanelProps, Message } from '$types/sections/chat'

/** Assistant glyph tile avatar. */
function AssistantAvatar() {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        background: 'linear-gradient(135deg, var(--acc-soft), rgba(20,184,166,0.22))',
        border: '1px solid var(--acc-border, rgba(0,217,244,0.4))',
      }}
    >
      <KnikGlyph size={16} glow={false} />
    </div>
  )
}

/** Read reasoning steps from message metadata, if present. */
function reasoningSteps(msg: Message): AgentThinkingStep[] | null {
  const r = msg.metadata?.reasoning
  if (Array.isArray(r) && r.length > 0) return r as AgentThinkingStep[]
  return null
}

export default function ChatPanel({ messages, isLoading, summaryMessageId }: ChatPanelProps) {
  const handleCopy = (content: string) => {
    void navigator.clipboard.writeText(content)
  }

  let compactionDividerIndex = -1
  let summaryContent: string | undefined
  if (summaryMessageId) {
    for (let i = 0; i < messages.length; i++) {
      const msgMeta = messages[i].metadata as Record<string, unknown> | undefined
      if (msgMeta?.message_id === summaryMessageId) {
        compactionDividerIndex = i
        summaryContent = messages[i].content
        break
      }
    }
  }

  return (
    <div className="min-h-full" style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      {messages.map((msg, idx) => {
        const isUser = msg.role === 'user'
        const isLastMessage = idx === messages.length - 1
        const isStreaming = isLastMessage && !!isLoading && msg.role === 'assistant'
        const steps = !isUser ? reasoningSteps(msg) : null
        const modelTag = typeof msg.metadata?.model === 'string' ? msg.metadata.model : undefined

        return (
          <div key={idx}>
            <motion.div
              initial={{ opacity: 0, x: isUser ? 12 : -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex"
              style={{ gap: 13, flexDirection: isUser ? 'row-reverse' : 'row' }}
            >
              {isUser ? <Avatar initials={DEMO_ACCOUNT.initials} size={30} /> : <AssistantAvatar />}

              <div
                style={{
                  maxWidth: isUser ? '78%' : '100%',
                  flex: isUser ? 'none' : 1,
                  minWidth: 0,
                }}
              >
                {!isUser && (
                  <div className="flex items-center" style={{ gap: 8, marginBottom: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>
                      Knik AI
                    </span>
                    {modelTag && (
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 10.5,
                          color: 'var(--fg-4)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-1)',
                          padding: '1px 6px',
                          borderRadius: 5,
                        }}
                      >
                        {modelTag}
                      </span>
                    )}
                    {msg.timestamp && (
                      <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--fg-5)' }}>
                        {msg.timestamp}
                      </span>
                    )}
                  </div>
                )}

                {!isUser && steps && !isStreaming && (
                  <div style={{ marginBottom: 12 }}>
                    <AgentThinking steps={steps} />
                  </div>
                )}

                <div
                  style={{
                    fontSize: 14.5,
                    lineHeight: 1.6,
                    color: isUser ? 'var(--fg-1)' : 'var(--fg-2)',
                    background: isUser ? 'var(--bg-surface-2)' : 'transparent',
                    border: isUser ? '1px solid var(--border-2)' : 'none',
                    borderRadius: isUser ? 'var(--r-card, 12px)' : 0,
                    padding: isUser ? '11px 15px' : 0,
                  }}
                >
                  <MarkdownMessage content={msg.content} isStreaming={isStreaming} />
                </div>

                {!isUser && !isStreaming && (
                  <div className="flex" style={{ gap: 1, marginTop: 8 }}>
                    <ActionIcon
                      size={30}
                      icon={<MS name="content_copy" size={15} />}
                      title="Copy"
                      onClick={() => handleCopy(msg.content)}
                    />
                    <ActionIcon size={30} icon={<MS name="thumb_up" size={15} />} title="Good" />
                    <ActionIcon size={30} icon={<MS name="thumb_down" size={15} />} title="Bad" />
                    <ActionIcon
                      size={30}
                      icon={<MS name="refresh" size={15} />}
                      title="Regenerate"
                    />
                  </div>
                )}
              </div>
            </motion.div>
            {idx === compactionDividerIndex && (
              <CompactionDivider summaryContent={summaryContent} />
            )}
          </div>
        )
      })}

      {isLoading && messages.length === 0 && (
        <div className="flex" style={{ gap: 13 }}>
          <AssistantAvatar />
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  )
}
