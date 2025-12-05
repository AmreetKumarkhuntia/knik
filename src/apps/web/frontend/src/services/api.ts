/**
 * API client for backend communication
 */

const API_BASE_URL = 'http://localhost:8000/api'

export interface ChatRequest {
  message: string
}

export interface ChatResponse {
  text: string
  audio: string  // base64 encoded
  sample_rate: number
}

export const api = {
  /**
   * Send a chat message and get text + audio response
   */
  async chat(message: string): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }
    
    return response.json()
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
