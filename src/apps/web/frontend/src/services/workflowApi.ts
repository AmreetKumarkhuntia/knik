import type {
  ExecutionHistoryResponse,
  Schedule,
  ScheduleCreateRequest,
  ScheduleCreateResponse,
  SchedulesListResponse,
  WorkflowDetailResponse,
  WorkflowExecuteRequest,
  WorkflowExecuteResponse,
  WorkflowsListResponse,
} from '../types/workflow'

const API_BASE_URL = 'http://localhost:8000/api'

class WorkflowAPI {
  static async list(): Promise<WorkflowsListResponse> {
    const response = await fetch(`${API_BASE_URL}/workflows`)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async get(workflowId: string): Promise<WorkflowDetailResponse> {
    const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}`)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async execute(
    workflowId: string,
    inputs?: Record<string, unknown>
  ): Promise<WorkflowExecuteResponse> {
    const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs } as WorkflowExecuteRequest),
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async delete(workflowId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}`, { method: 'DELETE' })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async getHistory(workflowId: string): Promise<ExecutionHistoryResponse> {
    const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}/history`)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }
}

class ScheduleAPI {
  static async list(): Promise<SchedulesListResponse> {
    const response = await fetch(`${API_BASE_URL}/cron`)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async create(request: ScheduleCreateRequest): Promise<ScheduleCreateResponse> {
    const response = await fetch(`${API_BASE_URL}/cron`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async delete(scheduleId: number): Promise<{ success: boolean; schedule_id: number }> {
    const response = await fetch(`${API_BASE_URL}/cron/${scheduleId}`, { method: 'DELETE' })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async toggle(
    scheduleId: number,
    enabled: boolean
  ): Promise<{ success: boolean; schedule: Schedule }> {
    const response = await fetch(`${API_BASE_URL}/cron/${scheduleId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }
}

export const workflowApi = {
  workflows: WorkflowAPI,
  schedules: ScheduleAPI,
}

export { WorkflowAPI, ScheduleAPI }
