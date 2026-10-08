import { Link } from 'react-router-dom'
import { Input, MS } from '$components'
import Button from '$components/buttons/Button'
import type { WorkflowNavbarProps } from '$types/sections/workflow-builder'

export default function WorkflowNavbar({
  onExportJson,
  onSave,
  onExecute,
  onBack,
  onNameChange,
  canRun = false,
  readOnly = false,
  workflowName,
}: WorkflowNavbarProps) {
  return (
    <header className="min-h-16 border-b border-border glass flex flex-wrap items-center justify-between gap-3 p-4 sm:px-8 flex-shrink-0 z-20">
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="Back to workflows">
          <MS name="arrow_back" size={20} />
        </Button>
        <Link to="/workflows" className="font-medium text-secondary hover:text-subtle">
          Workflows
        </Link>
        <MS name="chevron_right" size={16} />
        {!readOnly && onNameChange ? (
          <Input
            aria-label="Workflow name"
            value={workflowName ?? ''}
            onChange={event => onNameChange(event.target.value)}
            className="!px-2 !py-1 text-sm max-w-56"
          />
        ) : (
          <span className="font-semibold text-foreground">{workflowName ?? 'Create Workflow'}</span>
        )}
      </div>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          {onExportJson && (
            <Button
              variant="secondary"
              size="sm"
              icon={<MS name="download" size={16} />}
              onClick={onExportJson}
            >
              Export JSON
            </Button>
          )}
          {onExecute && (
            <Button
              variant="secondary"
              size="sm"
              icon={<MS name="play_arrow" size={16} />}
              disabled={!canRun}
              title={canRun ? 'Run supplied demo scenario' : 'No demo run scenario supplied'}
              onClick={onExecute}
            >
              Run
            </Button>
          )}
          {onSave && (
            <Button
              variant="primary"
              size="sm"
              icon={<MS name="save" size={16} />}
              onClick={onSave}
            >
              Save Workflow
            </Button>
          )}
        </div>
      )}
    </header>
  )
}
