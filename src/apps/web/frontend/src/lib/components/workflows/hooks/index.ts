import { useCallback, useEffect, useState } from 'react'
import { workflowApi } from '$services/workflowApi'
import type { ExecutionRecord, Schedule, Workflow } from '$types/workflow'

interface UseWorkflowsReturn {
  workflows: Pick<Workflow, 'id' | 'name' | 'description'>[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useWorkflows(): UseWorkflowsReturn {
  const [workflows, setWorkflows] = useState<UseWorkflowsReturn['workflows']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await workflowApi.workflows.list()
      setWorkflows(response.workflows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  return { workflows, loading, error, refetch: fetchWorkflows }
}

interface UseSchedulesReturn {
  schedules: Schedule[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  toggleSchedule: (id: number, enabled: boolean) => Promise<void>
  deleteSchedule: (id: number) => Promise<void>
}

export function useSchedules(): UseSchedulesReturn {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await workflowApi.schedules.list()
      setSchedules(response.schedules)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules')
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleSchedule = useCallback(async (id: number, enabled: boolean) => {
    await workflowApi.schedules.toggle(id, enabled)
    setSchedules(prev => prev.map(s => (s.id === id ? { ...s, enabled } : s)))
  }, [])

  const deleteSchedule = useCallback(async (id: number) => {
    await workflowApi.schedules.delete(id)
    setSchedules(prev => prev.filter(s => s.id !== id))
  }, [])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  return { schedules, loading, error, refetch: fetchSchedules, toggleSchedule, deleteSchedule }
}

interface UseExecutionsReturn {
  executions: ExecutionRecord[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useExecutions(workflowId: string | null): UseExecutionsReturn {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExecutions = useCallback(async () => {
    if (!workflowId) {
      setExecutions([])
      return
    }
    try {
      setLoading(true)
      setError(null)
      const response = await workflowApi.workflows.getHistory(workflowId)
      setExecutions(response.history)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch executions')
    } finally {
      setLoading(false)
    }
  }, [workflowId])

  useEffect(() => {
    fetchExecutions()
  }, [fetchExecutions])

  return { executions, loading, error, refetch: fetchExecutions }
}

interface UseRealtimeStatusReturn {
  isPolling: boolean
  startPolling: () => void
  stopPolling: () => void
}

export function useRealtimeStatus(
  callback: () => void,
  intervalMs: number = 5000
): UseRealtimeStatusReturn {
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    if (!isPolling) return
    const interval = setInterval(callback, intervalMs)
    return () => clearInterval(interval)
  }, [isPolling, callback, intervalMs])

  const startPolling = useCallback(() => setIsPolling(true), [])
  const stopPolling = useCallback(() => setIsPolling(false), [])

  return { isPolling, startPolling, stopPolling }
}
