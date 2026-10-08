import { useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, ExecutionFlowGraph, ExecutionTimeline, MS, Tabs } from '$components'
import Button from '$components/buttons/Button'
import JsonViewer from '$components/chat/JsonViewer'
import { useExecutionDetailView } from '$stores/views'
import { useFeedbackStore } from '$stores/feedback'
import type { ExecutionDetailWidgetProps } from '$types/sections/workflow-builder'
import type { ExecutionDetailTab } from '$types/stores/executions'

export default function ExecutionDetailWidget({ executionId }: ExecutionDetailWidgetProps) {
  const navigate = useNavigate()
  const panelId = useId()
  const addToast = useFeedbackStore(state => state.addToast)
  const handleCopy = (text: string) => {
    void Promise.resolve()
      .then(() => navigator.clipboard.writeText(text))
      .then(() => addToast('Copied to clipboard.', 'success'))
      .catch(() => addToast('Could not copy to clipboard.', 'error'))
  }
  const {
    execution,
    timeline,
    definition,
    workflowName,
    metrics,
    tab,
    collapsed,
    setTab,
    togglePanel,
  } = useExecutionDetailView(executionId)
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
  return (
    <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-y-auto md:overflow-hidden bg-background">
      <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-border">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-2xl font-semibold text-foreground">Execution #{execution.id}</h1>
          <span className="text-sm text-secondary truncate">{workflowName}</span>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          {metrics.map(metric => (
            <div key={metric.id} className="flex items-baseline gap-2 text-sm">
              <dt className="text-secondary">{metric.label}</dt>
              <dd className="font-medium text-foreground">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div
        className="h-[580px] shrink-0 md:h-auto md:flex-1 md:min-h-48 relative"
        aria-label="Execution flow"
      >
        <ExecutionFlowGraph
          definition={definition}
          definitionError={
            definition ? null : 'Workflow definition is not available in this session.'
          }
          timeline={timeline}
          className="h-full w-full"
        />
      </div>
      <section
        aria-label="Execution details"
        className={`shrink-0 flex flex-col border-t border-border bg-surface ${collapsed ? '' : 'md:h-[280px]'}`}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border">
          <Tabs<ExecutionDetailTab>
            tabs={[
              { id: 'inputs', label: 'Inputs' },
              { id: 'outputs', label: 'Outputs' },
              { id: 'timeline', label: 'Timeline' },
            ]}
            active={tab}
            onChange={setTab}
            idPrefix={panelId}
            variant="pills"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePanel}
            aria-label={collapsed ? 'Expand execution details' : 'Collapse execution details'}
            aria-expanded={!collapsed}
            aria-controls={`${panelId}-content`}
          >
            <MS name={collapsed ? 'expand_less' : 'expand_more'} size={18} />
          </Button>
        </div>
        <div id={`${panelId}-content`} hidden={collapsed} className="min-h-0 overflow-auto p-4">
          <div
            role="tabpanel"
            id={`${panelId}-panel-${tab}`}
            aria-labelledby={`${panelId}-tab-${tab}`}
            tabIndex={0}
          >
            {tab === 'timeline' ? (
              <ExecutionTimeline timeline={timeline} loading={false} onCopy={handleCopy} />
            ) : (
              <JsonViewer
                data={tab === 'inputs' ? execution.inputs : execution.outputs}
                onCopy={handleCopy}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
