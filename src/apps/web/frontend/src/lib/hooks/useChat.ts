import { useState, useCallback } from 'react'
import { streamChat, queueAudio, clearAudioQueue, ConversationAPI } from '../../services'
import type { Message, UseChatProps, UseChatReturn } from '../../types/hooks'

export function useChat({
  setAudioPlaying,
  streamControllerRef,
  success,
  error,
}: UseChatProps): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const handleNewChat = useCallback(() => {
    setMessages([])
    setInputText('')
    setConversationId(null)
  }, [])

  const handleClearHistory = useCallback(() => {
    setMessages([])
    setConversationId(null)
    success('History cleared!')
  }, [success])

  const loadConversation = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        const conversation = await ConversationAPI.get(id)
        const loadedMessages: Message[] = conversation.messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: m.timestamp,
          metadata: m.metadata,
        }))
        setMessages(loadedMessages)
        setConversationId(id)
        setInputText('')
      } catch (err) {
        console.error('Failed to load conversation:', err)
        error('Failed to load conversation')
      } finally {
        setLoading(false)
      }
    },
    [error]
  )

  const handleSend = async (): Promise<void> => {
    if (!inputText.trim() || loading) return

    const userMessage: Message = { role: 'user', content: inputText }
    const messageCopy = inputText
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setLoading(true)

    const assistantMessageIndex = messages.length + 1
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      clearAudioQueue()
      setAudioPlaying(true)

      let audioChunkCount = 0

      const controller = await streamChat(
        messageCopy,
        {
          onConversationId: (id: string) => {
            setConversationId(id)
          },
          onText: (textChunk: string) => {
            setMessages(prev => {
              const updated = [...prev]
              if (updated[assistantMessageIndex]) {
                updated[assistantMessageIndex] = {
                  ...updated[assistantMessageIndex],
                  content: updated[assistantMessageIndex].content + textChunk,
                }
              }
              return updated
            })
          },
          onAudio: (audioBase64: string) => {
            audioChunkCount++
            console.log(`[useChat] Queueing audio chunk ${audioChunkCount}`)
            queueAudio(audioBase64, 24000)
          },
          onComplete: (count: number) => {
            console.log(`[useChat] Stream complete: ${count} audio chunks`)
            setLoading(false)
            success('Response received!')
          },
          onError: (errorMsg: string) => {
            console.error('[useChat] Stream error:', errorMsg)
            error(`Error: ${errorMsg}`)
            setLoading(false)
            setAudioPlaying(false)
          },
        },
        { conversationId: conversationId ?? undefined }
      )

      streamControllerRef.current = controller
    } catch (err) {
      console.error('Chat error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      error(`Error: ${errorMsg}`)

      setMessages(prev => {
        const updated = [...prev]
        if (updated[assistantMessageIndex]) {
          updated[assistantMessageIndex] = {
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
          }
        }
        return updated
      })
      setLoading(false)
      setAudioPlaying(false)
    }
  }

  return {
    messages,
    inputText,
    setInputText,
    loading,
    setLoading,
    conversationId,
    handleNewChat,
    handleClearHistory,
    handleSend,
    loadConversation,
  }
}
