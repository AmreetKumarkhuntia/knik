/**
 * ChatPanel Component
 * Displays chat messages with smooth animations
 */

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  messages: Message[]
  isLoading?: boolean
}

export default function ChatPanel({ messages, isLoading }: ChatPanelProps) {

  return (
    <div className="min-h-full space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/70">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-3xl border border-white/30 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <span className="text-5xl">🤖</span>
          </div>
          <h2 className="text-3xl font-bold mb-3 text-white">
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
              className={`max-w-[70%] px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 backdrop-blur-3xl border ${
                msg.role === 'user'
                  ? 'bg-white/5 text-white border-white/50 animate-slide-in-right'
                  : 'bg-black/10 text-white border-white/30 animate-slide-in-left'
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
          <div className="bg-black/10 backdrop-blur-3xl border border-white/30 px-6 py-4 rounded-xl shadow-2xl animate-slide-in-left">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
