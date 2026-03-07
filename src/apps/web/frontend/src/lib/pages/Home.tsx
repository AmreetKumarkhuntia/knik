import { useRef, useEffect } from 'react'
import ChatPanel from '$sections/chat/ChatPanel'
import InputPanel from '$sections/chat/InputPanel'
import AudioControls from '$sections/audio/AudioControls'
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
    <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto px-6 pt-6 pb-40 scroll-smooth scrollbar-hide"
      >
        <div className="max-w-4xl mx-auto">
          <ChatPanel messages={messages} isLoading={loading} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 p-6 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
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
    </div>
  )
}
