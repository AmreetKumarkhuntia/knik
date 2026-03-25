import { useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '$sections/theme'
import MainLayout from '$sections/layout/MainLayout'
import ErrorBoundary from '$sections/feedback/ErrorBoundary'
import { Home, Workflows, WorkflowBuilder, ExecutionDetail, AllExecutions } from '$pages/index'
import { useToast, useAudio, useChat } from '$hooks/index'
import type { InputPanelRef } from '$types/sections/chat'

function AppContent() {
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

  // Single useChat instance shared between layout (sidebar) and Home page
  const chat = useChat({
    setAudioPlaying,
    streamControllerRef,
    success,
    error,
  })

  const { handleNewChat, handleClearHistory, loadConversation } = chat

  const onNewChat = useCallback(() => {
    handleNewChat()
    if (inputRef.current) {
      inputRef.current.clear()
    }
  }, [handleNewChat])

  const onSelectConversation = useCallback(
    (conversationId: string) => {
      void loadConversation(conversationId)
    },
    [loadConversation]
  )

  return (
    <BrowserRouter>
      <MainLayout
        toasts={toasts}
        hideToast={hideToast}
        onNewChat={onNewChat}
        onClearHistory={handleClearHistory}
        onSelectConversation={onSelectConversation}
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
                chat={chat}
              />
            }
          />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/workflows/create" element={<WorkflowBuilder />} />
          <Route path="/workflows/:id/edit" element={<WorkflowBuilder />} />
          <Route path="/workflows/executions" element={<AllExecutions />} />
          <Route path="/executions/:id" element={<ExecutionDetail />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  )
}
