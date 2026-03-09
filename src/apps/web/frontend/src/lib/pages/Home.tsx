import { useRef, useEffect, useState } from 'react'
import ChatPanel from '$sections/chat/ChatPanel'
import InputPanel from '$sections/chat/InputPanel'
import AudioControls from '$sections/audio/AudioControls'
import { WelcomePrompt, SuggestionCards, WelcomeContainer, KeyboardShortcuts } from '$sections/home'
import type { HomeProps } from '$types/pages'
import type { InputPanelRef } from '$types/sections/chat'
import { useKeyboardShortcuts, useChat } from '$hooks'
import { CHAT_DEFAULTS, KEYBOARD_SHORTCUTS, LAYOUT } from '$lib/constants'

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
  const [isUserScrolling, setIsUserScrolling] = useState(false)

  const { messages, inputText, setInputText, loading, handleSend } = useChat({
    setAudioPlaying,
    streamControllerRef,
    success,
    error,
  })

  useEffect(() => {
    const chatContainer = chatScrollRef.current
    if (!chatContainer) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50
      setIsUserScrolling(!isAtBottom)
    }

    chatContainer.addEventListener('scroll', handleScroll)

    return () => {
      chatContainer.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    const chatContainer = chatScrollRef.current
    if (!chatContainer) return

    const { scrollTop, scrollHeight, clientHeight } = chatContainer
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50

    if (!isUserScrolling || isAtBottom) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messages, loading, isUserScrolling])

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
      key: KEYBOARD_SHORTCUTS.focusInput.key,
      ctrlKey: KEYBOARD_SHORTCUTS.focusInput.ctrlKey,
      handler: () => inputRef.current?.focus(),
    },
    {
      key: KEYBOARD_SHORTCUTS.clearInput.key,
      handler: () => inputRef.current?.clear(),
    },
  ])

  const handleSelectPrompt = (prompt: string) => {
    setInputText(prompt)
    setTimeout(() => {
      void handleSend()
    }, CHAT_DEFAULTS.promptSelectionTimeout)
  }

  return (
    <div className="relative z-10 flex-1 flex flex-col p-6">
      <div className="flex-1 flex flex-col items-center">
        {messages.length === 0 ? (
          <div
            className="flex-1 flex flex-col justify-center w-full"
            style={{ maxWidth: LAYOUT.maxWidthPercentage }}
          >
            <WelcomeContainer isVisible={messages.length === 0}>
              <WelcomePrompt />
              <SuggestionCards onSelectPrompt={handleSelectPrompt} />
            </WelcomeContainer>
          </div>
        ) : (
          <div className="flex-1 w-full" style={{ maxWidth: LAYOUT.maxWidthPercentage }}>
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto py-6 scroll-smooth scrollbar-hide"
              style={{ minHeight: 0 }}
            >
              <ChatPanel messages={messages} isLoading={loading} />
            </div>
          </div>
        )}
      </div>

      <div className="w-full mx-auto mt-6" style={{ maxWidth: LAYOUT.maxWidthPercentage }}>
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

      <KeyboardShortcuts isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}
