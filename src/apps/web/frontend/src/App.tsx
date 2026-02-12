import { useState, useRef, useEffect } from 'react'
import { Sidebar, ChatPanel, InputPanel, ErrorBoundary, Toast, MenuIcon, PlayIcon, PauseIcon, StopIcon } from './lib/components'
import type { InputPanelRef } from './lib/components'
import { useToast, useKeyboardShortcuts } from './lib/hooks'
import { stopAudio, streamChat, queueAudio, clearAudioQueue, setAudioStateCallback, pauseAudio, resumeAudio } from './services'

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
  const [audioPaused, setAudioPaused] = useState(false)
  const inputRef = useRef<InputPanelRef>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const streamControllerRef = useRef<AbortController | null>(null)
  const { toasts, hideToast, success, error } = useToast()

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, loading])

  useEffect(() => {
    setAudioStateCallback((isPaused, isPlaying) => {
      console.log('[App] Audio state changed:', { isPaused, isPlaying })
      setAudioPaused(isPaused)
      setAudioPlaying(isPlaying)
    })
    
    return () => setAudioStateCallback(null)
  }, [])

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
    const messageCopy = inputText
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setLoading(true)

    const assistantMessageIndex = messages.length + 1
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      clearAudioQueue()
      setAudioPlaying(true)
      
      let audioChunkCount = 0
      
      const controller = await streamChat(messageCopy, {
        onText: (textChunk: string) => {
          setMessages(prev => {
            const updated = [...prev]
            if (updated[assistantMessageIndex]) {
              updated[assistantMessageIndex] = {
                ...updated[assistantMessageIndex],
                content: updated[assistantMessageIndex].content + textChunk
              }
            }
            return updated
          })
        },
        onAudio: (audioBase64: string) => {
          audioChunkCount++
          console.log(`[App] Queueing audio chunk ${audioChunkCount}`)
          queueAudio(audioBase64, 24000)
        },
        onComplete: (count: number) => {
          console.log(`[App] Stream complete: ${count} audio chunks`)
          setLoading(false)
          setTimeout(() => {
            setAudioPlaying(false)
          }, 1000)
          success('Response received!')
        },
        onError: (errorMsg: string) => {
          console.error('[App] Stream error:', errorMsg)
          error(`Error: ${errorMsg}`)
          setLoading(false)
          setAudioPlaying(false)
        }
      })
      
      streamControllerRef.current = controller
      
    } catch (err) {
      console.error('Chat error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      error(`Error: ${errorMsg}`)
      
      setMessages(prev => {
        const updated = [...prev]
        if (updated[assistantMessageIndex]) {
          updated[assistantMessageIndex] = {
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.'
          }
        }
        return updated
      })
      setLoading(false)
      setAudioPlaying(false)
    }
  }

  const handleStopAudio = () => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort()
      streamControllerRef.current = null
    }
    
    stopAudio()
    clearAudioQueue()
    setAudioPlaying(false)
    setLoading(false)
  }

  const handleTogglePause = () => {
    if (audioPaused) {
      resumeAudio()
    } else {
      pauseAudio()
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
            className="fixed top-6 left-6 z-20 w-11 h-11 bg-white/5 backdrop-blur-3xl border border-white/30 
                       rounded-lg flex items-center justify-center text-white hover:bg-white/10 
                       transition-all duration-200 shadow-2xl hover:scale-105"
            aria-label="Open sidebar"
          >
            <MenuIcon className="w-5 h-5" />
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
            {/* Audio control buttons - appear when audio is playing */}
            {audioPlaying && (
              <div className="mb-3 flex justify-center gap-2">
                {/* Pause/Resume button */}
                <button
                  onClick={handleTogglePause}
                  className={`${
                    audioPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
                  } text-white px-6 py-3 rounded-lg font-semibold 
                             transition-all duration-200 shadow-xl hover:shadow-2xl active:scale-95
                             flex items-center gap-2`}
                >
                  {audioPaused ? (
                    <>
                      <PlayIcon />
                      Resume
                    </>
                  ) : (
                    <>
                      <PauseIcon />
                      Pause
                    </>
                  )}
                </button>

                {/* Stop button */}
                <button
                  onClick={handleStopAudio}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold 
                           transition-all duration-200 shadow-xl hover:shadow-2xl active:scale-95
                           flex items-center gap-2"
                >
                  <StopIcon />
                  Stop
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
