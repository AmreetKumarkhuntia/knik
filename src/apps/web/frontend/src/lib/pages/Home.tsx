import { useRef, useEffect, useState } from 'react'
import ChatPanel from '$sections/chat/ChatPanel'
import InputPanel from '$sections/chat/InputPanel'
import AudioControls from '$sections/audio/AudioControls'
import { WelcomePrompt, SuggestionCards, WelcomeContainer, KeyboardShortcuts } from '$sections/home'
import type { HomeProps } from '$types/pages'
import type { InputPanelRef } from '$types/sections/chat'
import { useKeyboardShortcuts, useChat } from '$hooks'

export default function Home({
  setAudioPlaying,
  audioPlaying,
  audioPaused,
  streamControllerRef,
  handleStopAudio,
  handleTogglePause,
  success,
  error,
}: HomeProps) {
  const inputRef = useRef<InputPanelRef>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const { messages, inputText, setInputText, loading, handleSend } = useChat({
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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.shiftKey) {
        e.preventDefault()
        setShortcutsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
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

  const handleSelectPrompt = (prompt: string) => {
    setInputText(prompt)
    setTimeout(() => {
      void handleSend()
    }, 100)
  }

  return (
    <div className="relative z-10 flex-1 overflow-hidden flex flex-col p-6">
      <div className="flex-1 overflow-hidden flex flex-col items-center">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center w-full" style={{ maxWidth: '70%' }}>
            <WelcomeContainer isVisible={messages.length === 0}>
              <WelcomePrompt />
              <SuggestionCards onSelectPrompt={handleSelectPrompt} />
            </WelcomeContainer>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col w-full" style={{ maxWidth: '70%' }}>
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto py-6 scroll-smooth scrollbar-hide"
            >
              <ChatPanel messages={messages} isLoading={loading} />
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 p-6 pointer-events-none">
        <div className="w-full mx-auto pointer-events-auto" style={{ maxWidth: '70%' }}>
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
            onSend={() => void handleSend()}
            disabled={loading}
          />
        </div>
      </div>

      <KeyboardShortcuts isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}
