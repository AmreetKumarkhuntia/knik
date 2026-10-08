import { useEffect, useRef } from 'react'
import { ChatBubble, MarkdownMessage, Avatar, KnikGlyph, AgentThinking, Banner } from '$components'
import ChatComposer from '$components/chat/ChatComposer'
import CompactionDivider from '$components/chat/CompactionDivider'
import WelcomePrompt from '$components/home/WelcomePrompt'
import WelcomeContainer from '$components/home/WelcomeContainer'
import SuggestionCards from '$components/home/SuggestionCards'
import KeyboardShortcuts from '$components/home/KeyboardShortcuts'
import { useChatStore, useChatScope, useSendMessage } from '$stores/chat'
import { useSettingsStore } from '$stores/settings'
import { useFeedbackStore } from '$stores/feedback'
import { useChatView } from '$stores/views'
import type { InputPanelRef } from '$types/sections/chat'

function ChatSessionWidget() {
  const activeId = useChatStore(state => state.activeConversationId)
  const { scopeId, scope, patch } = useChatScope(activeId)
  const { draft, shortcutsOpen } = scope
  const { conversationId, conversation, models, suggestions, model, messages, initials } =
    useChatView()
  const updateSettings = useSettingsStore(state => state.updateSettings)
  const sendMessage = useSendMessage()
  const addToast = useFeedbackStore(state => state.addToast)
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

  const copy = (text: string) => {
    const clipboard = Reflect.get(navigator, 'clipboard') as Clipboard | undefined
    if (!clipboard) {
      addToast('Clipboard is unavailable in this browser.', 'error')
      return
    }
    void clipboard
      .writeText(text)
      .then(() => addToast('Copied to clipboard.'))
      .catch(() => addToast('Could not copy to the clipboard.', 'error'))
  }

  const send = () => {
    const result = sendMessage(scopeId)
    if (result.ok) {
      setDraft('')
      atBottom.current = true
    } else addToast(result.error, 'info')
  }

  return (
    <div className="relative z-10 flex flex-col h-full px-4 sm:px-6 py-6 gap-5">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide"
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
        ) : (
          <div className="max-w-5xl mx-auto py-4 flex flex-col gap-7">
            {messages.map((message, index) => {
              const { isUser, steps, modelTag, messageId } = message
              return (
                <div key={`${message.id || messageId}:${index}`}>
                  <ChatBubble
                    role={isUser ? 'user' : 'assistant'}
                    content={<MarkdownMessage content={message.content} onCopy={copy} />}
                    avatar={
                      isUser ? (
                        <Avatar initials={initials} size={30} />
                      ) : (
                        <div className="flex items-center justify-center w-[30px] h-[30px] rounded-lg bg-[var(--acc-soft)] border border-[var(--acc-border)]">
                          <KnikGlyph size={16} glow={false} />
                        </div>
                      )
                    }
                    header={
                      !isUser ? (
                        <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
                          <span className="font-semibold text-fg-1">Knik AI</span>
                          {modelTag && (
                            <span className="font-mono text-[10.5px] text-fg-4">{modelTag}</span>
                          )}
                          {message.timestamp && (
                            <span className="font-mono text-[10.5px] text-fg-5">
                              {message.timestamp}
                            </span>
                          )}
                        </div>
                      ) : undefined
                    }
                    reasoning={
                      !isUser && steps.length > 0 ? <AgentThinking steps={steps} /> : undefined
                    }
                    actions={!isUser ? { copy: () => copy(message.content) } : undefined}
                  />
                  {conversation?.summary_message_id === messageId && (
                    <CompactionDivider summaryContent={message.content} onCopy={copy} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="w-full max-w-3xl mx-auto">
        <ChatComposer
          ref={inputRef}
          value={draft}
          onChange={setDraft}
          onSend={send}
          model={model}
          onModel={id => updateSettings({ model: id })}
          models={models}
        />
      </div>
      <KeyboardShortcuts isOpen={shortcutsOpen} onClose={() => patch({ shortcutsOpen: false })} />
    </div>
  )
}

export default function ChatWidget() {
  const conversationId = useChatStore(state => state.activeConversationId)
  return <ChatSessionWidget key={conversationId || 'new-chat'} />
}
