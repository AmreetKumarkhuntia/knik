import { useState, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '$sections/layout/MainLayout'
import ErrorBoundary from '$sections/feedback/ErrorBoundary'
import { Home, Workflows } from '$pages'
import { useToast, useAudio, useChat } from '$hooks'
import type { InputPanelRef } from '$types/sections/chat'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const inputRef = useRef<InputPanelRef>(null)
  const { toasts, hideToast, success, error } = useToast()

  const {
    audioPlaying,
    setAudioPlaying,
    audioPaused,
    streamControllerRef,
    handleStopAudio,
    handleTogglePause,
  } = useAudio()

  const { handleNewChat, handleClearHistory } = useChat({
    setAudioPlaying,
    streamControllerRef,
    success,
    error,
  })

  const onNewChat = useCallback(() => {
    handleNewChat()
    if (inputRef.current) {
      inputRef.current.clear()
    }
  }, [handleNewChat])

  return (
    <BrowserRouter>
      <MainLayout
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        toasts={toasts}
        hideToast={hideToast}
        onNewChat={onNewChat}
        onClearHistory={handleClearHistory}
      >
        <Routes>
          <Route
            path="/"
            element={
              <Home
                setAudioPlaying={setAudioPlaying}
                audioPlaying={audioPlaying}
                audioPaused={audioPaused}
                streamControllerRef={streamControllerRef}
                handleStopAudio={handleStopAudio}
                handleTogglePause={handleTogglePause}
                success={success}
                error={error}
              />
            }
          />
          <Route path="/workflows" element={<Workflows />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}
