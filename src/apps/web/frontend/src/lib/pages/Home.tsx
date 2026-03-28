import { useRef, useEffect, useState } from 'react'
import ChatPanel from '$sections/chat/ChatPanel'
import InputPanel from '$sections/chat/InputPanel'
import AudioControls from '$sections/audio/AudioControls'
import { WelcomePrompt, SuggestionCards, WelcomeContainer, KeyboardShortcuts } from '$sections/home'
import type { HomeProps } from '$types/pages'
import { useKeyboardShortcuts } from '$hooks/index'
import { useStore } from '$store/index'
import { CHAT_DEFAULTS, KEYBOARD_SHORTCUTS, LAYOUT } from '$lib/constants'

/** Home page with chat, audio controls, and welcome state. */
export default function Home({ inputRef }: HomeProps) {
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [isUserScrolling, setIsUserScrolling] = useState(false)

  const messages = useStore(s => s.messages)
  const inputText = useStore(s => s.inputText)
  const setInputText = useStore(s => s.setInputText)
  const loading = useStore(s => s.loading)
  const handleSend = useStore(s => s.handleSend)
  const audioPlaying = useStore(s => s.audioPlaying)
  const audioPaused = useStore(s => s.audioPaused)
  const handleStopAudio = useStore(s => s.handleStopAudio)
  const handleTogglePause = useStore(s => s.handleTogglePause)

  useEffect(() => {
    const chatContainer = chatScrollRef.current
    if (!chatContainer) return

    let scrollTimeout: number
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)

      scrollTimeout = window.setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = chatContainer
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight
        setIsUserScrolling(distanceFromBottom > 300)
      }, 100)
    }

    chatContainer.addEventListener('scroll', handleScroll)

    return () => {
      chatContainer.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [])

  useEffect(() => {
    const chatContainer = chatScrollRef.current
    if (!chatContainer) return

    const scrollToBottom = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      const isAtBottom = distanceFromBottom < 150

      if (!isUserScrolling || isAtBottom) {
        requestAnimationFrame(() => {
          chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth',
          })
        })
      }
    }

    const timer = setTimeout(scrollToBottom, 50)
    return () => clearTimeout(timer)
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
    <div className="relative z-10 flex flex-col h-full p-6 pb-24">
      <div className="flex-1 flex flex-col items-center min-h-0">
        {messages.length === 0 ? (
          <div
            className="flex-1 flex flex-col justify-center w-full"
            style={{ maxWidth: LAYOUT.maxWidthPercentage }}
          >
            <WelcomeContainer isVisible={true}>
              <WelcomePrompt />
              <SuggestionCards onSelectPrompt={handleSelectPrompt} />
            </WelcomeContainer>
          </div>
        ) : (
          <div className="flex-1 w-full h-full" style={{ maxWidth: LAYOUT.maxWidthPercentage }}>
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto py-6 scroll-smooth scrollbar-hide"
              style={{ height: '100%', contain: 'content' }}
            >
              <ChatPanel messages={messages} isLoading={loading} />
            </div>
          </div>
        )}
      </div>

      <div
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 mx-auto"
        style={{ maxWidth: LAYOUT.maxWidthPercentage, width: '50vw' }}
      >
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
