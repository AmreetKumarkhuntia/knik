import { Link, useNavigate } from 'react-router-dom'
import type { WorkflowNavbarProps } from '$types/sections/workflow-builder'

export default function WorkflowNavbar({
  onExportJson,
  onSave,
  readOnly = false,
  workflowName,
}: WorkflowNavbarProps) {
  const navigate = useNavigate()
  const pageLabel = workflowName ?? 'Create Workflow'

  return (
    <header className="h-16 border-b border-border glass flex items-center justify-between px-8 flex-shrink-0 z-20">
      {/* Breadcrumb — matches PageHeader style */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => void navigate(-1)}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface transition-colors"
          title="Back"
        >
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px' }}>
            arrow_back
          </span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to="/workflows"
            className="font-medium text-secondary hover:text-subtle transition-colors"
          >
            Workflows
          </Link>
          <span className="material-symbols-outlined text-secondary text-sm">chevron_right</span>
          <span className="font-semibold text-foreground">{pageLabel}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!readOnly && onExportJson && (
          <button
            onClick={onExportJson}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-secondary hover:text-foreground hover:bg-surface transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export JSON
          </button>
        )}

        {!readOnly && onSave && (
          <button
            onClick={() => void onSave()}
            className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-foreground transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            <span className="material-symbols-outlined text-sm">save</span>
            Save Workflow
          </button>
        )}
      </div>
    </header>
  )
}
