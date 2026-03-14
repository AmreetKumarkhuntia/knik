import { MarkdownMessage } from '$components/MarkdownMessage'
import LoadingSpinner from '$components/LoadingSpinner'
import Card from '$components/Card'
import { motion } from 'framer-motion'
import { ContentCopy, ThumbUp, Refresh } from '@mui/icons-material'
import type { ChatPanelProps } from '$types/sections/chat'

export default function ChatPanel({ messages, isLoading }: ChatPanelProps) {
  const handleCopy = (content: string) => {
    void navigator.clipboard.writeText(content)
  }

  const handleRegenerate = () => {
    console.log('Regenerate response')
  }

  return (
    <div className="min-h-full space-y-4">
      {messages.length === 0
        ? null
        : messages.map((msg, idx) => {
            const isLastMessage = idx === messages.length - 1
            const isStreaming = isLastMessage && isLoading && msg.role === 'assistant'

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card
                  variant="default"
                  padding="md"
                  className={`max-w-[70%] shadow-2xl transition-all duration-300 border border-border ${
                    msg.role === 'user' ? 'animate-slide-in-right' : 'animate-slide-in-left'
                  }`}
                >
                  <div className="flex flex-col items-start justify-between gap-3">
                    <div className="flex-1">
                      {msg.role === 'user' ? (
                        <MarkdownMessage content={msg.content} />
                      ) : (
                        <MarkdownMessage content={msg.content} isStreaming={isStreaming} />
                      )}
                    </div>

                    <div>
                      {msg.role === 'assistant' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center gap-1 flex-shrink-0"
                        >
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCopy(msg.content)}
                            className="p-1.5 rounded-lg text-textSecondary hover:text-text transition-colors duration-200"
                            aria-label="Copy message"
                          >
                            <ContentCopy style={{ fontSize: 16 }} />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1.5 rounded-lg text-textSecondary hover:text-text transition-colors duration-200"
                            aria-label="Like message"
                          >
                            <ThumbUp style={{ fontSize: 16 }} />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleRegenerate}
                            className="p-1.5 rounded-lg text-textSecondary hover:text-text transition-colors duration-200"
                            aria-label="Regenerate response"
                          >
                            <Refresh style={{ fontSize: 16 }} />
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}

      {isLoading && messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          className="flex justify-start"
        >
          <Card variant="bordered" padding="md" className="animate-slide-in-left">
            <LoadingSpinner size="sm" />
          </Card>
        </motion.div>
      )}
    </div>
  )
}
