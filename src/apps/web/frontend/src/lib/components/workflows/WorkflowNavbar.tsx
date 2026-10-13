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
    <header className="min-h-[52px] bg-surface border-b border-border-1 flex flex-wrap items-center justify-between gap-2 px-4 py-2 flex-shrink-0 z-20">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          className="knik-btn--icon"
          onClick={onBack}
          aria-label="Back to workflows"
        >
          <MS name="arrow_back" size={20} />
        </Button>
        {!readOnly && onNameChange ? (
          // min-h stays non-important so the 44px coarse-pointer minimum in primitives.css still applies.
          <Input
            fullWidth={false}
            aria-label="Workflow name"
            value={workflowName ?? ''}
            onChange={event => onNameChange(event.target.value)}
            className="!w-56 max-w-full min-h-[34px] !px-2.5 !py-0 rounded-[9px] !bg-transparent !border-transparent hover:!bg-panel hover:!border-border-2 focus:!bg-panel focus:!border-[var(--primary)] text-h4 text-fg-1"
          />
        ) : (
          <span className="min-w-0 px-2.5 text-h4 text-fg-1 truncate">
            {workflowName ?? 'Create Workflow'}
          </span>
        )}
      </div>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          {onExportJson && (
            <Button
              variant="secondary"
              size="sm"
              className="rounded-[10px]"
              icon={<MS name="download" size={17} />}
              onClick={onExportJson}
            >
              Export JSON
            </Button>
          )}
          {onExecute && (
            <Button
              variant="secondary"
              size="sm"
              className="rounded-[10px]"
              icon={<MS name="play_arrow" size={17} fill={1} />}
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
              className="rounded-[10px]"
              icon={<MS name="save" size={17} />}
              onClick={onSave}
            >
              Save workflow
            </Button>
          )}
        </div>
      )}
    </header>
  )
}
