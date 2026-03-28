import type { ChatResponse, Conversation, ConversationListResponse } from '../types/api'

const API_BASE_URL = 'http://localhost:8000/api'

/** Handles chat streaming, history retrieval, and history clearing. */
class ChatAPI {
  static async stream(
    message: string,
    onAudioChunk?: (audio: string, sampleRate: number) => void,
    conversationId?: string
  ): Promise<ChatResponse & { conversation_id?: string }> {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversation_id: conversationId }),
    })

    if (!response.ok) throw new Error(`API error: ${response.statusText}`)

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let fullText = ''
    const audioChunks: string[] = []
    let buffer = ''
    let receivedConversationId: string | undefined

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (reader) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let currentEvent = ''
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.substring(6).trim()
        } else if (line.startsWith('data:')) {
          const jsonData = line.substring(5).trim()
          try {
            const parsed = JSON.parse(jsonData)
            if (currentEvent === 'text' && parsed.text) {
              fullText += parsed.text
            } else if (currentEvent === 'audio' && parsed.audio) {
              audioChunks.push(parsed.audio)
              if (onAudioChunk) {
                onAudioChunk(parsed.audio, parsed.sample_rate || 24000)
              }
            } else if (currentEvent === 'conversation_id' && parsed.conversation_id) {
              receivedConversationId = parsed.conversation_id
            }
          } catch (e) {
            console.error('Parse error:', e, jsonData)
          }
        } else if (line.trim() === '') {
          currentEvent = ''
        }
      }
    }

    return {
      text: fullText,
      audioChunks,
      audio: audioChunks.length > 0 ? audioChunks[0] : '',
      sample_rate: 24000,
      conversation_id: receivedConversationId,
    }
  }

  static async getHistory() {
    const response = await fetch(`${API_BASE_URL}/history`)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async clearHistory() {
    const response = await fetch(`${API_BASE_URL}/history/clear`, { method: 'POST' })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }
}

/** CRUD operations for conversations. */
class ConversationAPI {
  static async list(limit = 20, offset = 0): Promise<ConversationListResponse> {
    const response = await fetch(`${API_BASE_URL}/conversations?limit=${limit}&offset=${offset}`)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async get(conversationId: string): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async create(
    title?: string
  ): Promise<{ id: string; title: string | null; status: string }> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(title ? { title } : {}),
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async delete(conversationId: string): Promise<{ status: string; id: string }> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async updateTitle(
    conversationId: string,
    title: string
  ): Promise<{ status: string; id: string; title: string }> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }
}

/** Admin-related API calls. */
class AdminAPI {
  static async getSettings() {
    const response = await fetch(`${API_BASE_URL}/admin/settings`)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }
}

export { ConversationAPI }

/** Unified client exposing all API namespaces. */
export class ApiClient {
  static chat = ChatAPI
  static conversations = ConversationAPI
  static admin = AdminAPI
}

/** Convenience object with commonly used API methods. */
export const api = {
  chat: ApiClient.chat.stream,
  getHistory: ApiClient.chat.getHistory,
  clearHistory: ApiClient.chat.clearHistory,
  getSettings: ApiClient.admin.getSettings,
}
