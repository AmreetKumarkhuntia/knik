import { useState, useRef, useEffect } from 'react'
import { Sidebar, ChatPanel, InputPanel, ErrorBoundary, Toast } from './lib/components'
import type { InputPanelRef } from './lib/components'
import { useToast, useKeyboardShortcuts } from './lib/hooks'
import { api, playAudio, stopAudio, isAudioPlaying } from './services'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function AppContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const inputRef = useRef<InputPanelRef>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const { toasts, hideToast, success, error } = useToast()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, loading])

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
      setAudioPlaying(true)
      try {
        await playAudio(response.audio, response.sample_rate)
      } catch (audioErr) {
        console.error('Audio playback error:', audioErr)
      } finally {
        setAudioPlaying(false)
      }
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

  const handleStopAudio = () => {
    stopAudio()
    setAudioPlaying(false)
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
            className="fixed top-6 left-6 z-50 w-11 h-11 bg-white/5 backdrop-blur-3xl border border-white/30 
                       rounded-lg flex items-center justify-center text-white hover:bg-white/10 
                       transition-all duration-200 shadow-2xl hover:scale-105"
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

        {/* Bounded scrollable chat container */}
        <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-6 pt-6 pb-40 scroll-smooth scrollbar-hide">
            <div className="max-w-4xl mx-auto">
              <ChatPanel messages={messages} isLoading={loading} />
            </div>
          </div>
        </div>

        {/* Fixed input panel at bottom - hovering above content */}
        <div className="fixed bottom-0 left-0 right-0 z-20 p-6 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            {/* Stop audio button - appears when audio is playing */}
            {audioPlaying && (
              <div className="mb-3 flex justify-center">
                <button
                  onClick={handleStopAudio}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold 
                           transition-all duration-200 shadow-xl hover:shadow-2xl active:scale-95
                           flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="6" y="4" width="8" height="12" rx="1" />
                  </svg>
                  Stop Audio
                </button>
              </div>
            )}
            <InputPanel 
              ref={inputRef}
              value={inputText}
              onChange={setInputText}
              onSend={handleSend}
              disabled={loading}
            />
          </div>
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
