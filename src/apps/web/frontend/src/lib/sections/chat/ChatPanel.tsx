import { MarkdownMessage } from '$components/MarkdownMessage'
import EmptyState from '$components/EmptyState'
import LoadingSpinner from '$components/LoadingSpinner'
import Card from '$components/Card'
import type { ChatPanelProps } from '$types/sections/chat'

export default function ChatPanel({ messages, isLoading }: ChatPanelProps) {
  return (
    <div className="min-h-full space-y-4">
      {messages.length === 0 ? (
        <EmptyState
          icon="🤖"
          title="Welcome to Knik!"
          description="Your voice-enabled AI assistant"
          className="min-h-[60vh]"
        />
      ) : (
        messages.map((msg, idx) => {
          const isLastMessage = idx === messages.length - 1
          const isStreaming = isLastMessage && isLoading && msg.role === 'assistant'

          return (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card
                variant="default"
                padding="md"
                className={`max-w-[70%] shadow-2xl transition-all duration-300 border border-white/20 ${
                  msg.role === 'user' ? 'animate-slide-in-right' : 'animate-slide-in-left'
                }`}
              >
                {msg.role === 'user' ? (
                  <MarkdownMessage content={msg.content} />
                ) : (
                  <MarkdownMessage content={msg.content} isStreaming={isStreaming} />
                )}
              </Card>
            </div>
          )
        })
      )}

      {isLoading && messages.length === 0 && (
        <div className="flex justify-start">
          <Card variant="bordered" padding="md" className="animate-slide-in-left">
            <LoadingSpinner size="sm" />
          </Card>
        </div>
      )}
    </div>
  )
}
