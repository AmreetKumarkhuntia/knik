import { memo, useEffect, useRef, useState } from 'react'
import {
  ChatBubble,
  MarkdownMessage,
  Avatar,
  KnikGlyph,
  AgentThinking,
  Banner,
  Modal,
} from '$components'
import ChatComposer from '$components/chat/ChatComposer'
import ToolGroupList from '$components/settings/ToolGroupList'
import CompactionDivider from '$components/chat/CompactionDivider'
import WelcomePrompt from '$components/home/WelcomePrompt'
import WelcomeContainer from '$components/home/WelcomeContainer'
import SuggestionCards from '$components/home/SuggestionCards'
import KeyboardShortcuts from '$components/home/KeyboardShortcuts'
import { useChatStore, useChatScope, useSendMessage } from '$stores/chat'
import { useSettingsStore } from '$stores/settings'
import { useFeedbackStore } from '$stores/feedback'
import { useChatView, useProvidersView } from '$stores/views'
import { useCopyToClipboard } from '$widgets/feedback/useCopyToClipboard'
import type { InputPanelRef } from '$types/sections/chat'
import type { ChatTranscriptProps } from '$types/widgets/chat-shell'

// Memoized apart from the composer so typing a draft never re-renders or re-parses the transcript.
// The log stays mounted while empty so the first reply is announced too.
const ChatTranscript = memo(function ChatTranscript({
  messages,
  initials,
  summaryMessageId,
  onCopy,
}: ChatTranscriptProps) {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Conversation"
      className={
        messages.length > 0 ? 'w-full max-w-[800px] mx-auto py-6 flex flex-col gap-6' : undefined
      }
    >
      {messages.map((message, index) => {
        const { isUser, steps, modelTag, messageId } = message
        return (
          <div key={`${message.id || messageId}:${index}`}>
            <ChatBubble
              role={isUser ? 'user' : 'assistant'}
              content={<MarkdownMessage content={message.content} onCopy={onCopy} />}
              avatar={
                isUser ? (
                  <Avatar initials={initials} size={30} />
                ) : (
                  <div className="flex items-center justify-center w-[30px] h-[30px] rounded-lg bg-[var(--acc-soft)] border border-[var(--acc-border)]">
                    <KnikGlyph size={16} />
                  </div>
                )
              }
              header={
                !isUser ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
                    <span className="font-semibold text-fg-1">Knik AI</span>
                    {modelTag && <span className="text-xs text-fg-3">{modelTag}</span>}
                    {message.timestamp && (
                      <span className="text-xs text-fg-3">{message.timestampLabel}</span>
                    )}
                  </div>
                ) : undefined
              }
              reasoning={!isUser && steps.length > 0 ? <AgentThinking steps={steps} /> : undefined}
              actions={!isUser ? { copy: () => onCopy(message.content) } : undefined}
            />
            {summaryMessageId === messageId && (
              <CompactionDivider summaryContent={message.content} onCopy={onCopy} />
            )}
          </div>
        )
      })}
    </div>
  )
})

function ChatSessionWidget() {
  const activeId = useChatStore(state => state.activeConversationId)
  const { scopeId, scope, patch } = useChatScope(activeId)
  const { draft, shortcutsOpen, toolsOpen } = scope
  const { conversationId, conversation, models, suggestions, model, messages, initials } =
    useChatView()
  const updateSettings = useSettingsStore(state => state.updateSettings)
  const { tools } = useProvidersView()
  const toggleTool = useSettingsStore(state => state.toggleTool)
  const sendMessage = useSendMessage()
  const addToast = useFeedbackStore(state => state.addToast)
  const copy = useCopyToClipboard()
  const inputRef = useRef<InputPanelRef>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)
  const setDraft = (draft: string) => patch({ draft, error: '' })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const element = event.target
      const editing =
        element instanceof HTMLElement &&
        (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName))
      if (
        ((event.ctrlKey || event.metaKey) && event.key === '/') ||
        (event.key === '?' && !editing)
      ) {
        event.preventDefault()
        patch({ shortcutsOpen: !shortcutsOpen })
      }
      if (
        event.key === 'Escape' &&
        element === scrollRef.current?.parentElement?.querySelector('textarea')
      )
        patch({ draft: '', error: '' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [patch, shortcutsOpen])

  useEffect(() => {
    if (atBottom.current && scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [conversation?.messages.length])

  const send = () => {
    const result = sendMessage(scopeId)
    if (result.ok) {
      setDraft('')
      atBottom.current = true
    } else addToast(result.error, 'info')
  }

  return (
    <div className="flex flex-col h-full min-h-0 px-4 sm:px-6 pb-4 sm:pb-5">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto"
        onScroll={event => {
          const element = event.currentTarget
          atBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 150
        }}
      >
        {conversationId && !conversation ? (
          <Banner variant="info">
            This conversation is no longer available in the current session.
          </Banner>
        ) : messages.length === 0 ? (
          <WelcomeContainer isVisible>
            <WelcomePrompt />
            {suggestions.length > 0 && (
              <SuggestionCards
                suggestions={suggestions}
                onSelectPrompt={prompt => {
                  setDraft(prompt)
                  inputRef.current?.focus()
                }}
              />
            )}
          </WelcomeContainer>
        ) : null}
        <ChatTranscript
          messages={messages}
          initials={initials}
          summaryMessageId={conversation?.summary_message_id}
          onCopy={copy}
        />
      </div>
      <div className="w-full max-w-[800px] mx-auto pt-3 shrink-0">
        <ChatComposer
          ref={inputRef}
          value={draft}
          onChange={setDraft}
          onSend={send}
          model={model}
          onModel={id => updateSettings({ model: id })}
          models={models}
          onOpenTools={() => patch({ toolsOpen: true })}
          toolsOpen={toolsOpen}
        />
      </div>
      <Modal
        isOpen={toolsOpen}
        onClose={() => patch({ toolsOpen: false })}
        title="Chat tools"
        placement="right"
        size="sm"
      >
        <p className="text-sm text-fg-3 mb-4">
          Choose the tool groups available across this session.
        </p>
        <ToolGroupList groups={tools} onToggle={toggleTool} />
      </Modal>
      <KeyboardShortcuts isOpen={shortcutsOpen} onClose={() => patch({ shortcutsOpen: false })} />
    </div>
  )
}

export default function ChatWidget() {
  const conversationId = useChatStore(state => state.activeConversationId)
  // sendMessage binds the welcome screen's scope to the conversation its first send creates.
  const createdBySession = useChatStore(state =>
    Object.values(state.scopes).some(
      scope => conversationId !== null && scope?.resourceId === conversationId
    )
  )
  // Switching conversations remounts the session, but the first send keeps it mounted so the
  // live log announces the reply and the composer keeps focus.
  const [session, setSession] = useState({ conversationId, generation: 0 })
  if (session.conversationId !== conversationId)
    setSession({
      conversationId,
      generation: session.generation + (createdBySession ? 0 : 1),
    })
  return <ChatSessionWidget key={session.generation} />
}
