import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import type {
  ExecutionDetail as ExecutionDetailType,
  NodeExecutionStep,
  WorkflowDefinition,
} from '$types/workflow'
import { workflowApi } from '$services/workflowApi'
import { calculateMetrics } from '$lib/utils/metricsCalculator'

import {
  PageHeader,
  MetricCard,
  ExecutionFlowGraph,
  StructuredOutput,
  ExecutionTimeline,
} from '$components'
import { FullScreenLoader, FullScreenError } from '$widgets'

/** Execution detail page showing metrics, flow graph, I/O, and timeline. */
export default function ExecutionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [execution, setExecution] = useState<ExecutionDetailType | null>(null)
  const [timeline, setTimeline] = useState<NodeExecutionStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [definition, setDefinition] = useState<WorkflowDefinition | null>(null)
  const [definitionError, setDefinitionError] = useState<string | null>(null)
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

  // Fetch the workflow definition once per workflow id — not on every 3 s poll
  // tick (the polled `execution` object gets a new identity each fetch).
  const workflowId = execution?.workflow_id
  useEffect(() => {
    if (!workflowId) return
    // Hoisted function declarations don't see the narrowing above — capture it.
    const wid = workflowId
    let cancelled = false

    async function fetchDefinition() {
      try {
        const detail = await workflowApi.workflows.get(wid)
        if (!cancelled) {
          setDefinition(detail.workflow)
          setDefinitionError(null)
        }
      } catch (err) {
        console.error('Failed to build execution graph:', err)
        if (!cancelled) setDefinitionError('Failed to load execution graph')
      }
    }

    void fetchDefinition()

    return () => {
      cancelled = true
    }
  }, [workflowId])

  if (loading) {
    return <FullScreenLoader variant="screen" />
  }

  if (error || !execution) {
    return (
      <FullScreenError
        layout="screen"
        message={error || 'Execution not found'}
        onBack={() => void navigate(-1)}
      />
    )
  }

  const metrics = calculateMetrics({ success: true, execution, timeline })

  return (
    <div className="h-screen flex flex-col bg-background">
      <PageHeader
        breadcrumbs={['Workflows', execution.workflow_name, `Execution #${execution.id}`]}
        sticky={true}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
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

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Execution Flow</h2>
            <ExecutionFlowGraph
              definition={definition}
              definitionError={definitionError}
              timeline={timeline}
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Inputs & Outputs</h2>
            <StructuredOutput
              inputs={execution.inputs}
              outputs={execution.outputs}
              loading={false}
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Execution Timeline</h2>
            <ExecutionTimeline timeline={timeline} loading={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
