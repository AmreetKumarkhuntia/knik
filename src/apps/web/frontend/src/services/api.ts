import type { ChatResponse, CronSchedulesResponse } from '../types/api'

const API_BASE_URL = 'http://localhost:8000/api'

class ChatAPI {
  static async stream(
    message: string,
    onAudioChunk?: (audio: string, sampleRate: number) => void
  ): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) throw new Error(`API error: ${response.statusText}`)

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

class AdminAPI {
  static async getSettings() {
    const response = await fetch(`${API_BASE_URL}/admin/settings`)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }
}

class CronAPI {
  static async getSchedules(): Promise<CronSchedulesResponse> {
    const response = await fetch(`${API_BASE_URL}/cron`)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async addSchedule(workflow_id: string, trigger_workflow_id: string, timezone = 'UTC') {
    const response = await fetch(`${API_BASE_URL}/cron`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow_id, trigger_workflow_id, timezone }),
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async removeSchedule(schedule_id: number) {
    const response = await fetch(`${API_BASE_URL}/cron/${schedule_id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }
}

export class ApiClient {
  static chat = ChatAPI
  static admin = AdminAPI
  static cron = CronAPI
}

// Backward-compatible api export map
export const api = {
  chat: ApiClient.chat.stream,
  getHistory: ApiClient.chat.getHistory,
  clearHistory: ApiClient.chat.clearHistory,
  getSettings: ApiClient.admin.getSettings,
  getCronSchedules: ApiClient.cron.getSchedules,
  addCronSchedule: ApiClient.cron.addSchedule,
  removeCronSchedule: ApiClient.cron.removeSchedule,
}
