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
}

export default function ChatPanel({ messages }: ChatPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-white/60">
          <div className="text-6xl mb-4">🤖</div>
          <h2 className="text-2xl font-semibold mb-2">Welcome to Knik!</h2>
          <p className="text-lg">Your voice-enabled AI assistant</p>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-lg transition-all duration-300 ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white animate-slide-in-right'
                  : 'bg-white/20 backdrop-blur-sm text-white animate-slide-in-left'
              }`}
            >
              <p className="text-base leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
