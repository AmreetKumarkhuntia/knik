export interface ChatRequest {
  message: string
}

export interface ChatResponse {
  text: string
  audio: string
  audioChunks: string[]
  sample_rate: number
}
