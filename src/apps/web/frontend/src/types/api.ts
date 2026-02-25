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
  cron_expression: string
  timezone: string
}

export interface CronSchedulesResponse {
  success: boolean
  schedules: CronSchedule[]
  total: number
}
