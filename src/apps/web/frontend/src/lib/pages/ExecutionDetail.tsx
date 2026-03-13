import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import type { ExecutionDetail as ExecutionDetailType, NodeExecutionStep } from '$types/workflow'
import { workflowApi } from '$services/workflowApi'
import { calculateMetrics } from '$lib/utils/metricsCalculator'

import PageHeader from '$lib/components/PageHeader'
import MetricCard from '$lib/components/MetricCard'
import LoadingSpinner from '$lib/components/LoadingSpinner'
import ExecutionFlowGraph from '$lib/components/ExecutionFlowGraph'
import StructuredOutput from '$lib/components/StructuredOutput'
import ExecutionTimeline from '$lib/components/ExecutionTimeline'

export default function ExecutionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [execution, setExecution] = useState<ExecutionDetailType | null>(null)
  const [timeline, setTimeline] = useState<NodeExecutionStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Track status in a ref so the polling interval closure doesn't go stale
  const statusRef = useRef<string | null>(null)

  useEffect(() => {
    if (!id) return

    const executionId = parseInt(id, 10)
    if (isNaN(executionId)) {
      setError('Invalid execution ID')
      setLoading(false)
      return
    }

    async function fetchExecutionDetail() {
      try {
        const response = await workflowApi.analytics.getExecutionDetail(executionId)
        setExecution(response.execution)
        setTimeline(response.timeline)
        statusRef.current = response.execution.status
        setError(null)
      } catch (err) {
        console.error('Failed to fetch execution detail:', err)
        setError('Failed to load execution details')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    void fetchExecutionDetail()

    // Poll every 3 s while running; stop once the interval callback sees a
    // terminal status so we don't create a new interval on every re-render.
    const intervalId = setInterval(() => {
      if (statusRef.current !== 'running') {
        clearInterval(intervalId)
        return
      }
      void fetchExecutionDetail()
    }, 3000)

    return () => clearInterval(intervalId)
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !execution) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-500 text-lg">{error || 'Execution not found'}</p>
        <button
          onClick={() => void navigate(-1)}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
        >
          Go Back
        </button>
      </div>
    )
  }

  // Calculate dynamic metrics
  const metrics = calculateMetrics({ success: true, execution, timeline })

  return (
    <div className="h-screen flex flex-col bg-background">
      <PageHeader
        breadcrumbs={['Workflows', execution.workflow_name, `Execution #${execution.id}`]}
        sticky={true}
      />

      {/* Main content area with scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {metrics.map(metric => (
              <MetricCard
                key={metric.id}
                label={metric.label}
                value={metric.value}
                icon={metric.icon}
                color={metric.color}
                subtext={metric.subtext}
              />
            ))}
          </div>

          {/* Execution Flow Graph */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Execution Flow</h2>
            <ExecutionFlowGraph execution={execution} timeline={timeline} />
          </div>

          {/* Structured Output (Inputs/Outputs) */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Inputs & Outputs</h2>
            <StructuredOutput
              inputs={execution.inputs}
              outputs={execution.outputs}
              loading={false}
            />
          </div>

          {/* Execution Timeline */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Execution Timeline</h2>
            <ExecutionTimeline timeline={timeline} loading={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
