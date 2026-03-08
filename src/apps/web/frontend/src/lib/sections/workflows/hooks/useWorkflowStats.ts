import { useState, useEffect } from 'react'

export function useWorkflowStats(refreshInterval: number = 30000) {
  const [stats, setStats] = useState({
    totalExecutions: 0,
    activeJobs: 0,
    successRate: '—',
    hasData: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('http://localhost:8000/api/workflows/stats')

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setStats({
          totalExecutions: data.stats.totalExecutions || 0,
          activeJobs: data.stats.activeJobs || 0,
          successRate: data.stats.successRate || '—',
          hasData: data.stats.hasData || false,
        })
      } else {
        setError('Failed to fetch stats')
      }
    } catch (err) {
      console.error('Failed to fetch workflow stats:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchStats()

    const interval = setInterval(() => {
      void fetchStats()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  return { stats, loading, error, refetch: fetchStats }
}
