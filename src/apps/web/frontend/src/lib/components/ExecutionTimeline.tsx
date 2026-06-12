import type { ExecutionTimelineProps } from '$types/components'
import { getNodeIcon } from '$lib/constants/nodes'

/** Vertical timeline displaying execution step details. */
export default function ExecutionTimeline({ timeline, loading = false }: ExecutionTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="knik-glass rounded-lg p-4 h-20" />
          </div>
        ))}
      </div>
    )
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="knik-glass rounded-lg p-8 text-center">
        <p className="text-fg-3 text-sm">No execution steps available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {timeline.map((step, index) => (
        <div key={`${step.node_id}-${index}`} className="relative pl-8">
          {index < timeline.length - 1 && (
            <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-[var(--border-2)]" />
          )}

          <div
            className={`absolute left-0 top-2 w-6 h-6 rounded-full flex items-center justify-center ${
              step.status === 'success'
                ? 'bg-[var(--success-bg)] text-[var(--success)]'
                : step.status === 'failed'
                  ? 'bg-[var(--danger-bg)] text-[var(--danger)]'
                  : 'bg-[var(--info-bg)] text-[var(--info)]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {step.status === 'success' ? 'check' : step.status === 'failed' ? 'close' : 'pending'}
            </span>
          </div>

          <div className="knik-glass rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-fg-3">
                  {getNodeIcon(step.node_type)}
                </span>
                <h4 className="font-semibold text-fg-1">{step.node_id}</h4>
                <span className="text-xs text-fg-3">{step.node_type}</span>
              </div>
              <span className="text-xs text-fg-4">
                {step.duration_ms !== undefined ? `${step.duration_ms}ms` : 'N/A'}
              </span>
            </div>

            {step.error_message && (
              <div className="mt-2 p-2 bg-[var(--danger-bg)] border border-[rgba(239,68,68,0.2)] rounded text-xs text-[var(--danger)]">
                {step.error_message}
              </div>
            )}

            <details className="mt-3">
              <summary className="text-xs text-fg-3 cursor-pointer hover:text-[var(--primary)] transition-colors">
                View inputs/outputs
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-fg-4 mb-1">Inputs:</div>
                  <pre className="text-xs bg-surface-2 p-2 rounded overflow-auto max-h-32 text-fg-2">
                    {JSON.stringify(step.inputs, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-xs text-fg-4 mb-1">Outputs:</div>
                  <pre className="text-xs bg-surface-2 p-2 rounded overflow-auto max-h-32 text-fg-2">
                    {JSON.stringify(step.outputs, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          </div>
        </div>
      ))}
    </div>
  )
}
