/**
 * API client for backend communication
 */

const API_BASE_URL = 'http://localhost:8000/api'

export interface ChatRequest {
  message: string
}

export interface ChatResponse {
  text: string
  audio: string  // base64 encoded (first chunk for backward compatibility)
  audioChunks: string[]  // all audio chunks
  sample_rate: number
}

export const api = {
  /**
   * Send a chat message and get text + audio response (streaming)
   * Audio chunks are automatically queued for playback as they arrive
   */
  async chat(message: string, onAudioChunk?: (audio: string, sampleRate: number) => void): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    // Parse SSE stream
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let fullText = ''
    const audioChunks: string[] = []
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let currentEvent = ''
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.substring(6).trim()
          console.log('[SSE] Event type:', currentEvent)
        } else if (line.startsWith('data:')) {
          const jsonData = line.substring(5).trim()
          console.log('[SSE] Processing data for event:', currentEvent, '| Data preview:', jsonData.substring(0, 50))
          try {
            const parsed = JSON.parse(jsonData)
            if (currentEvent === 'text' && parsed.text) {
              fullText += parsed.text
              console.log('[SSE] Added text chunk')
            } else if (currentEvent === 'audio' && parsed.audio) {
              audioChunks.push(parsed.audio)
              console.log('[SSE] Audio chunk received, length:', parsed.audio.length)
              
              // Queue audio for immediate playback
              if (onAudioChunk) {
                onAudioChunk(parsed.audio, parsed.sample_rate || 24000)
              }
            }
          } catch (e) {
            console.error('Failed to parse SSE JSON:', e, jsonData)
          }
        } else if (line.trim() === '') {
          // Empty line marks end of an event
          console.log('[SSE] End of event, resetting currentEvent')
          currentEvent = ''
        }
      }
    }

    console.log('Parsed SSE stream:')
    console.log('- Text length:', fullText.length)
    console.log('- Audio chunks:', audioChunks.length)
    console.log('- Individual chunk lengths:', audioChunks.map(c => c.length))
    console.log('- Total audio data:', audioChunks.reduce((sum, c) => sum + c.length, 0))

    return {
      text: fullText,
      audioChunks: audioChunks, // Return array of chunks for sequential playback
      audio: audioChunks.length > 0 ? audioChunks[0] : '', // Keep for backward compatibility
      sample_rate: 24000
    }
  },
  
  /**
   * Get conversation history
   */
  async getHistory() {
    const response = await fetch(`${API_BASE_URL}/history`)
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }
    return response.json()
  },
  
  /**
   * Clear conversation history
   */
  async clearHistory() {
    const response = await fetch(`${API_BASE_URL}/history/clear`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }
    return response.json()
  },
  
  /**
   * Get current settings
   */
  async getSettings() {
    const response = await fetch(`${API_BASE_URL}/admin/settings`)
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }
    return response.json()
  },
}
