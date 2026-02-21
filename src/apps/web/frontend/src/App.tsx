import { useState, useRef, useEffect } from 'react'
import {
  Sidebar,
  ChatPanel,
  InputPanel,
  ErrorBoundary,
  Toast,
  BackgroundEffects,
  HamburgerButton,
  AudioControls,
} from './lib/components'
import type { InputPanelRef } from './lib/components'
import { useToast, useKeyboardShortcuts, useAudio, useChat } from './lib/hooks'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const inputRef = useRef<InputPanelRef>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const { toasts, hideToast, success, error } = useToast()

  const {
    audioPlaying,
    setAudioPlaying,
    audioPaused,
    streamControllerRef,
    handleStopAudio,
    handleTogglePause,
  } = useAudio()

  const {
    messages,
    inputText,
    setInputText,
    loading,
    handleNewChat,
    handleClearHistory,
    handleSend,
  } = useChat({
    setAudioPlaying,
    streamControllerRef,
    success,
    error,
  })

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, loading])

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

  return (
    <>
      <div className="h-screen bg-gray-950 relative overflow-hidden flex flex-col">
        {/* Gradient blobs with blur effect - animated floating orbs */}
        <BackgroundEffects />

        {/* Hamburger menu button - hides when sidebar is open */}
        {!sidebarOpen && (
          <HamburgerButton onClick={() => setSidebarOpen(true)} />
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
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-6 pt-6 pb-40 scroll-smooth scrollbar-hide"
          >
            <div className="max-w-4xl mx-auto">
              <ChatPanel messages={messages} isLoading={loading} />
            </div>
          </div>
        </div>

        {/* Fixed input panel at bottom - hovering above content */}
        <div className="fixed bottom-0 left-0 right-0 z-20 p-6 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            {/* Audio control buttons - appear when audio is playing or stream is still loading */}
            <AudioControls
              isPlayingOrLoading={audioPlaying || loading}
              isPaused={audioPaused}
              onTogglePause={handleTogglePause}
              onStop={handleStopAudio}
            />
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
