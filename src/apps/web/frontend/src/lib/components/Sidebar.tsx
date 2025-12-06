/**
 * Sidebar Component
 * ChatGPT-style collapsible sidebar with history and settings
 */

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onClearHistory: () => void
  onNewChat: () => void
}

export default function Sidebar({ isOpen, onClose, onClearHistory, onNewChat }: SidebarProps) {

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gray-950/95 backdrop-blur-xl border-r border-white/10 
                    z-40 transform transition-transform duration-300 ease-in-out shadow-2xl
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pt-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-teal-400 rounded-lg flex items-center justify-center text-xl">
                🤖
              </div>
              Knik AI
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat()
              onClose()
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-500 hover:to-teal-400
                     text-white px-4 py-3 rounded-xl font-semibold mb-6
                     transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95
                     flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>

          {/* Conversations Section */}
          <div className="flex-1 overflow-y-auto mb-6">
            <h3 className="text-sm font-semibold text-white/50 mb-3 px-2">Recent Conversations</h3>
            <div className="space-y-2">
              {/* Placeholder for conversation history */}
              <div className="text-white/40 text-sm px-2 py-8 text-center">
                No conversation history yet
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <button
              onClick={() => {
                onClearHistory()
                onClose()
              }}
              className="w-full text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 
                       rounded-xl transition-colors flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear History
            </button>
            
            <button
              className="w-full text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 
                       rounded-xl transition-colors flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
