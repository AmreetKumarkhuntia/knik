/**
 * ChatPanel Component
 * Displays chat messages with smooth animations and auto-scroll
 */

import { useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  messages: Message[]
  isLoading?: boolean
}

export default function ChatPanel({ messages, isLoading }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive (but not on initial load)
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4 scroll-smooth">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-white/70">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-teal-400 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <span className="text-5xl">🤖</span>
          </div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-300 to-teal-300 bg-clip-text text-transparent">
            Welcome to Knik!
          </h2>
          <p className="text-lg text-white/60">Your voice-enabled AI assistant</p>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-6 py-4 rounded-3xl shadow-xl transition-all duration-300 border ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white border-purple-400/30 animate-slide-in-right'
                  : 'bg-white/10 backdrop-blur-lg text-white border-white/20 animate-slide-in-left'
              }`}
            >
              <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 px-6 py-4 rounded-3xl shadow-xl animate-slide-in-left">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Auto-scroll anchor */}
      <div ref={bottomRef} />
    </div>
  )
}
