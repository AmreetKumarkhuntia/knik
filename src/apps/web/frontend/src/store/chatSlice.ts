import type { StateCreator } from 'zustand'
import { streamChat, queueAudio, clearAudioQueue, ConversationAPI } from '$services/index'
import type { Message } from '$types/sections/chat'
import type { AudioSlice } from './audioSlice'
import type { ToastSlice } from './toastSlice'

export interface ChatSlice {
  // State
  messages: Message[]
  inputText: string
  loading: boolean
  conversationId: string | null

  // Actions
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  setInputText: (text: string) => void
  setLoading: (loading: boolean) => void
  setConversationId: (id: string | null) => void
  handleNewChat: () => void
  handleClearHistory: () => void
  loadConversation: (id: string) => Promise<void>
  handleSend: () => Promise<void>
}

export const createChatSlice: StateCreator<
  ChatSlice & AudioSlice & ToastSlice,
  [],
  [],
  ChatSlice
> = (set, get) => ({
  // State
  messages: [],
  inputText: '',
  loading: false,
  conversationId: null,

  // Actions
  setMessages: messagesOrUpdater => {
    if (typeof messagesOrUpdater === 'function') {
      set(state => ({ messages: messagesOrUpdater(state.messages) }))
    } else {
      set({ messages: messagesOrUpdater })
    }
  },

  setInputText: (text: string) => set({ inputText: text }),
  setLoading: (loading: boolean) => set({ loading }),
  setConversationId: (id: string | null) => set({ conversationId: id }),

  handleNewChat: () => {
    set({ messages: [], inputText: '', conversationId: null })
  },

  handleClearHistory: () => {
    set({ messages: [], conversationId: null })
    get().success('History cleared!')
  },

  loadConversation: async (id: string) => {
    try {
      set({ loading: true })
      const conversation = await ConversationAPI.get(id)
      const loadedMessages: Message[] = conversation.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp,
        metadata: m.metadata,
      }))
      set({ messages: loadedMessages, conversationId: id, inputText: '' })
    } catch (err) {
      console.error('Failed to load conversation:', err)
      get().error('Failed to load conversation')
    } finally {
      set({ loading: false })
    }
  },

  handleSend: async () => {
    const { inputText, loading, messages, conversationId, setAudioPlaying, setStreamController } =
      get()
    if (!inputText.trim() || loading) return

    const userMessage: Message = { role: 'user', content: inputText }
    const messageCopy = inputText
    const assistantMessageIndex = messages.length + 1

    set(state => ({
      messages: [...state.messages, userMessage, { role: 'assistant', content: '' }],
      inputText: '',
      loading: true,
    }))

    try {
      clearAudioQueue()
      setAudioPlaying(true)

      let audioChunkCount = 0

      const controller = await streamChat(
        messageCopy,
        {
          onConversationId: (id: string) => {
            set({ conversationId: id })
          },
          onText: (textChunk: string) => {
            set(state => {
              const updated = [...state.messages]
              if (updated[assistantMessageIndex]) {
                updated[assistantMessageIndex] = {
                  ...updated[assistantMessageIndex],
                  content: updated[assistantMessageIndex].content + textChunk,
                }
              }
              return { messages: updated }
            })
          },
          onAudio: (audioBase64: string) => {
            audioChunkCount++
            console.log(`[chatSlice] Queueing audio chunk ${audioChunkCount}`)
            queueAudio(audioBase64, 24000)
          },
          onComplete: (count: number) => {
            console.log(`[chatSlice] Stream complete: ${count} audio chunks`)
            set({ loading: false })
            get().success('Response received!')
          },
          onError: (errorMsg: string) => {
            console.error('[chatSlice] Stream error:', errorMsg)
            get().error(`Error: ${errorMsg}`)
            set({ loading: false })
            setAudioPlaying(false)
          },
        },
        { conversationId: conversationId ?? undefined }
      )

      setStreamController(controller)
    } catch (err) {
      console.error('Chat error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      get().error(`Error: ${errorMsg}`)

      set(state => {
        const updated = [...state.messages]
        if (updated[assistantMessageIndex]) {
          updated[assistantMessageIndex] = {
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
          }
        }
        return { messages: updated, loading: false }
      })
      setAudioPlaying(false)
    }
  },
})
