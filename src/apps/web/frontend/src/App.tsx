import { useRef, useCallback, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '$sections/theme'
import MainLayout from '$sections/layout/MainLayout'
import ErrorBoundary from '$sections/feedback/ErrorBoundary'
import { Home, Workflows, WorkflowBuilder, ExecutionDetail, AllExecutions } from '$pages/index'
import { useStore } from '$store/index'
import type { InputPanelRef } from '$types/sections/chat'

/** Root app component with routing, audio setup, and theme provider. */
function AppContent() {
  const inputRef = useRef<InputPanelRef>(null)
  const initAudioCallbacks = useStore(s => s.initAudioCallbacks)
  const handleNewChat = useStore(s => s.handleNewChat)
  const loadConversation = useStore(s => s.loadConversation)

  useEffect(() => {
    const cleanup = initAudioCallbacks()
    return cleanup
  }, [initAudioCallbacks])

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
      <MainLayout onNewChat={onNewChat} onSelectConversation={onSelectConversation}>
        <Routes>
          <Route path="/" element={<Home inputRef={inputRef} />} />
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

/** Application entry point wrapped in error boundary and theme provider. */
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  )
}
