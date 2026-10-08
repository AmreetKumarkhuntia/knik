import { useNavigate } from 'react-router-dom'
import {
  EmptyState,
  PageHeader,
  MetricCard,
  ExecutionFlowGraph,
  StructuredOutput,
  ExecutionTimeline,
} from '$components'
import Button from '$components/buttons/Button'
import { useDemoSession } from '$widgets/session/useDemoSession'
import { calculateMetrics } from '$utils/metricsCalculator'
import type { ExecutionDetailWidgetProps } from '$types/sections/workflow-builder'

export default function ExecutionDetailWidget({ executionId }: ExecutionDetailWidgetProps) {
  const navigate = useNavigate()
  const addToast = useDemoSession(state => state.addToast)
  const handleCopy = (text: string) => {
    void Promise.resolve()
      .then(() => navigator.clipboard.writeText(text))
      .then(() => addToast('Copied to clipboard.', 'success'))
      .catch(() => addToast('Could not copy to clipboard.', 'error'))
  }
  const execution = useDemoSession(state =>
    state.executions.find(item => String(item.id) === executionId)
  )
  const timelines = useDemoSession(state => state.timelines)
  const workflows = useDemoSession(state => state.workflows)
  if (!execution)
    return (
      <EmptyState
        icon="search_off"
        title="Execution not found"
        description="This execution is not available in the current demo session."
        action={
          <Button onClick={() => void navigate('/workflows/executions')}>View executions</Button>
        }
      />
    )
  const timeline = timelines[String(execution.id)] ?? []
  const definition =
    workflows.find(workflow => workflow.id === execution.workflow_id)?.definition ?? null
  const metrics = calculateMetrics({ execution, timeline })
  return (
    <div className="h-full flex flex-col bg-background">
      <PageHeader
        breadcrumbs={['Workflows', execution.workflow_name, `Execution #${execution.id}`]}
        sticky
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-6">
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
              definitionError={
                definition ? null : 'Workflow definition is not available in this session.'
              }
              timeline={timeline}
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Inputs &amp; Outputs</h2>
            <StructuredOutput
              inputs={execution.inputs}
              outputs={execution.outputs}
              loading={false}
              onCopy={handleCopy}
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Execution Timeline</h2>
            <ExecutionTimeline timeline={timeline} loading={false} onCopy={handleCopy} />
          </div>
        </div>
      </div>
    </div>
  )
}
