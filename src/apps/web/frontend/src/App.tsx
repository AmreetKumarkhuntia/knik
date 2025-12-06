import { useState, useRef } from 'react'
import { Sidebar, ChatPanel, InputPanel, ErrorBoundary, Toast } from './lib/components'
import type { InputPanelRef } from './lib/components'
import { useToast, useKeyboardShortcuts } from './lib/hooks'
import { api, playAudio } from './services'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function AppContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const inputRef = useRef<InputPanelRef>(null)
  const { toasts, hideToast, success, error } = useToast()

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      handler: () => inputRef.current?.focus(),
    },
    {
      key: 'Escape',
      handler: () => inputRef.current?.clear(),
    },
  ])

  const handleNewChat = () => {
    setMessages([])
    setInputText('')
  }

  const handleClearHistory = () => {
    setMessages([])
    success('History cleared!')
  }

  const handleSend = async () => {
    if (!inputText.trim() || loading) return

    const userMessage: Message = { role: 'user', content: inputText }
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setLoading(true)

    try {
      // Call API
      const response = await api.chat(inputText)
      
      // Add AI response
      const aiMessage: Message = { role: 'assistant', content: response.text }
      setMessages(prev => [...prev, aiMessage])
      
      // Play audio
      await playAudio(response.audio, response.sample_rate)
      success('Response received!')
      
    } catch (err) {
      console.error('Chat error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      error(`Error: ${errorMsg}`)
      
      const errorMessage: Message = { 
        role: 'assistant', 
        content: 'Sorry, something went wrong. Please try again.' 
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="h-screen bg-gray-950 relative overflow-hidden flex flex-col">
        {/* Gradient blobs with blur effect - animated floating orbs */}
        <div className="absolute -top-20 -left-20 w-[700px] h-[700px] bg-purple-600 rounded-full blur-[140px] opacity-30 animate-blob pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-teal-500 rounded-full blur-[140px] opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[140px] opacity-20 animate-blob animation-delay-4000 pointer-events-none"></div>
        
        {/* Hamburger menu button - hides when sidebar is open */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-6 left-6 z-50 w-11 h-11 bg-white/10 backdrop-blur-lg border border-white/20 
                       rounded-xl flex items-center justify-center text-white hover:bg-white/20 
                       transition-all duration-200 shadow-xl hover:scale-105"
            aria-label="Open sidebar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={handleNewChat} 
          onClearHistory={handleClearHistory} 
        />

        {/* Content overlay */}
        <div className="relative z-10 flex-1 flex flex-col p-6 gap-4 max-w-7xl w-full mx-auto overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ChatPanel messages={messages} isLoading={loading} />
          </div>
          <InputPanel 
            ref={inputRef}
            value={inputText}
            onChange={setInputText}
            onSend={handleSend}
            disabled={loading}
          />
        </div>
      </div>
      
      {/* Toast notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </>
  )
}

// Wrap with ErrorBoundary
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}
