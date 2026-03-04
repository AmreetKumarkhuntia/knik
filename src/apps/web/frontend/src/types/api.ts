export interface ChatRequest {
  message: string
}

export interface ChatResponse {
  text: string
  audio: string
  audioChunks: string[]
  sample_rate: number
}

export interface CronSchedule {
  id: number
  workflow_id: string
  trigger_workflow_id: string
  timezone: string
  created_at?: string
  updated_at?: string
  last_executed_at?: string
}

export interface CronSchedulesResponse {
  success: boolean
  schedules: CronSchedule[]
  total: number
}
