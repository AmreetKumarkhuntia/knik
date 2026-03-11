import type { ExecutionTimelineProps } from '$types/components'
import { getNodeIcon } from '$lib/constants/nodes'

export default function ExecutionTimeline({ timeline, loading = false }: ExecutionTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="glass border border-white/10 rounded-lg p-4 h-20" />
          </div>
        ))}
      </div>
    )
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="glass border border-white/10 rounded-xl p-8 text-center">
        <p className="text-slate-400 text-sm">No execution steps available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {timeline.map((step, index) => (
        <div key={`${step.node_id}-${index}`} className="relative pl-8">
          {/* Timeline connector line */}
          {index < timeline.length - 1 && (
            <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-white/10" />
          )}

          {/* Timeline dot */}
          <div
            className={`absolute left-0 top-2 w-6 h-6 rounded-full flex items-center justify-center ${
              step.status === 'success'
                ? 'bg-teal-500/20 text-teal-400'
                : step.status === 'failed'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {step.status === 'success' ? 'check' : step.status === 'failed' ? 'close' : 'pending'}
            </span>
          </div>

          {/* Step content */}
          <div className="glass border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">
                  {getNodeIcon(step.node_type)}
                </span>
                <h4 className="font-semibold text-slate-100">{step.node_id}</h4>
                <span className="text-xs text-slate-400">{step.node_type}</span>
              </div>
              <span className="text-xs text-slate-500">
                {step.duration_ms !== undefined ? `${step.duration_ms}ms` : 'N/A'}
              </span>
            </div>

            {step.error_message && (
              <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-400">
                {step.error_message}
              </div>
            )}

            <details className="mt-3">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-primary transition-colors">
                View inputs/outputs
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Inputs:</div>
                  <pre className="text-xs bg-black/20 p-2 rounded overflow-auto max-h-32 text-slate-300">
                    {JSON.stringify(step.inputs, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Outputs:</div>
                  <pre className="text-xs bg-black/20 p-2 rounded overflow-auto max-h-32 text-slate-300">
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
