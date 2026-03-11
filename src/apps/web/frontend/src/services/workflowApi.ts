import type {
  ActivityResponse,
  DashboardResponse,
  ExecutionDetailResponse,
  ExecutionHistoryResponse,
  ExecutionsPaginatedResponse,
  Schedule,
  ScheduleCreateRequest,
  ScheduleCreateResponse,
  SchedulesListResponse,
  TopWorkflowsResponse,
  WorkflowDefinition,
  WorkflowDetailResponse,
  WorkflowExecuteRequest,
  WorkflowExecuteResponse,
  WorkflowListResponse,
  WorkflowMetricsResponse,
  WorkflowsListResponse,
} from '../types/workflow'

const API_BASE_URL = 'http://localhost:8000/api'

class WorkflowAPI {
  static async list(): Promise<WorkflowListResponse> {
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

  static async create(
    name: string,
    definition: WorkflowDefinition
  ): Promise<WorkflowDetailResponse> {
    const response = await fetch(`${API_BASE_URL}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, definition }),
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async update(
    workflowId: string,
    name: string,
    definition: WorkflowDefinition
  ): Promise<WorkflowDetailResponse> {
    const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, definition }),
    })
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

class AnalyticsAPI {
  static async getDashboard(
    workflowsLimit: number = 20,
    executionsLimit: number = 100
  ): Promise<DashboardResponse> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/dashboard?workflows_limit=${workflowsLimit}&executions_limit=${executionsLimit}`
    )
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async getMetrics(
    timeRange: string = 'today',
    workflowId?: string
  ): Promise<WorkflowMetricsResponse> {
    let url = `${API_BASE_URL}/analytics/metrics?time_range=${timeRange}`
    if (workflowId) {
      url += `&workflow_id=${workflowId}`
    }
    const response = await fetch(url)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async getTopWorkflows(
    limit: number = 10,
    timeRange: string = 'today'
  ): Promise<TopWorkflowsResponse> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/top-workflows?limit=${limit}&time_range=${timeRange}`
    )
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async getActivity(
    limit: number = 20,
    hoursBack: number = 24,
    executionId?: number
  ): Promise<ActivityResponse | ExecutionDetailResponse> {
    let url = `${API_BASE_URL}/analytics/activity?limit=${limit}&hours_back=${hoursBack}`
    if (executionId !== undefined) {
      url += `&execution_id=${executionId}`
    }
    const response = await fetch(url)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async getExecutionDetail(executionId: number): Promise<ExecutionDetailResponse> {
    const response = await fetch(`${API_BASE_URL}/analytics/activity?execution_id=${executionId}`)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async getExecutionsPaginated(
    page: number = 1,
    pageSize: number = 50,
    workflowId?: string,
    status?: string
  ): Promise<ExecutionsPaginatedResponse> {
    let url = `${API_BASE_URL}/analytics/executions?page=${page}&page_size=${pageSize}`
    if (workflowId) {
      url += `&workflow_id=${workflowId}`
    }
    if (status) {
      url += `&status=${status}`
    }
    const response = await fetch(url)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  static async getWorkflowsList(): Promise<WorkflowsListResponse> {
    const response = await fetch(`${API_BASE_URL}/analytics/workflows/list`)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }
}

export const workflowApi = {
  workflows: WorkflowAPI,
  schedules: ScheduleAPI,
  analytics: AnalyticsAPI,
}

export { WorkflowAPI, ScheduleAPI, AnalyticsAPI }
