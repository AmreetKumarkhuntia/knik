import { useId } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EmptyState,
  ExecutionFlowGraph,
  ExecutionTimeline,
  MS,
  StatusBadge,
  Tabs,
} from '$components'
import Button from '$components/buttons/Button'
import JsonViewer from '$components/chat/JsonViewer'
import { useExecutionDetailView } from '$stores/views'
import { useCopyToClipboard } from '$widgets/feedback/useCopyToClipboard'
import { ROUTES } from '$lib/constants/navigation'
import type { ExecutionDetailWidgetProps } from '$types/sections/workflow-builder'
import type { ExecutionDetailTab } from '$types/stores/executions'

export default function ExecutionDetailWidget({ executionId }: ExecutionDetailWidgetProps) {
  const navigate = useNavigate()
  const panelId = useId()
  const handleCopy = useCopyToClipboard()
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
        action={<Button onClick={() => void navigate(ROUTES.executions)}>View executions</Button>}
      />
    )
  return (
    <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-y-auto md:overflow-hidden">
      <div className="shrink-0 px-4 sm:px-6 pt-3.5 pb-3 border-b border-border-1 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="knik-btn--icon rounded-md"
            aria-label="Back to executions"
            onClick={() => void navigate(ROUTES.executions)}
          >
            <MS name="arrow_back" size={20} />
          </Button>
          <h1 className="text-h1 text-fg-1">Execution #{execution.id}</h1>
          <span className="min-w-0 text-body text-fg-3 truncate">{workflowName}</span>
          <StatusBadge status={execution.status} />
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 sm:pl-12">
          {metrics.map(metric => (
            <div key={metric.id} className="flex items-baseline gap-2">
              <dt className="text-body-sm text-fg-3">{metric.label}</dt>
              <dd className="text-body-sm font-semibold text-fg-1 tabular-nums">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <section
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
      </section>
      <section
        aria-label="Execution details"
        className={`shrink-0 flex flex-col border-t border-border-1 bg-surface ${collapsed ? '' : 'md:h-[280px]'}`}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border-1">
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
            className="knik-btn--icon rounded-[9px]"
            onClick={togglePanel}
            aria-label={collapsed ? 'Expand execution details' : 'Collapse execution details'}
            aria-expanded={!collapsed}
            aria-controls={`${panelId}-content`}
          >
            <MS
              name="expand_more"
              size={18}
              className={`transition-transform duration-slow ease-spring ${collapsed ? 'rotate-180' : ''}`}
            />
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
              <ExecutionTimeline timeline={timeline} onCopy={handleCopy} />
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
