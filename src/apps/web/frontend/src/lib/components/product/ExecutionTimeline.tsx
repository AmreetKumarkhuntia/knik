import CodeBlock from '../chat/CodeBlock'
import MS from '../display/MS'
import type { ExecutionTimelineProps } from '$types/components'
import { executionStatusConfig } from '$lib/constants'
import { getNodeIcon } from '$lib/constants/nodes'
import { formatDuration } from '$utils/format'

/** Vertical timeline displaying execution step details. */
export default function ExecutionTimeline({ timeline, onCopy }: ExecutionTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="rounded-[14px] border border-border-1 bg-panel p-8 text-center">
        <p className="text-body text-fg-3">No execution steps available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {timeline.map((step, index) => {
        const status = executionStatusConfig[step.status]
        const running = step.status === 'running'
        return (
          <div
            key={`${step.node_id}-${index}`}
            className="relative pl-[34px] knik-enter-rise"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            {index < timeline.length - 1 && (
              <div className="absolute left-[11px] top-[34px] -bottom-3 w-0.5 bg-border-2" />
            )}

            <div
              className={`absolute left-0 top-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-slow ease-out ${status.bg} ${status.text} ${
                running ? 'shadow-[0_0_0_4px_var(--acc-soft)]' : ''
              }`}
            >
              <MS
                name={
                  step.status === 'success'
                    ? 'check'
                    : step.status === 'failed'
                      ? 'close'
                      : running
                        ? 'progress_activity'
                        : 'pending'
                }
                size={14}
                className={running ? 'animate-spin' : ''}
              />
            </div>

            <div className="rounded-[14px] border border-border-1 bg-panel px-3.5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <MS name={getNodeIcon(step.node_type)} size={18} className="text-fg-3" />
                  <h2 className="text-body font-semibold text-fg-1 break-all">{step.node_id}</h2>
                  <span className={`text-caption capitalize ${status.text}`}>{step.status}</span>
                  <span className="font-mono text-caption text-fg-4 break-all">
                    {step.node_type}
                  </span>
                </div>
                <span className="font-mono text-caption text-fg-4">
                  {formatDuration(step.duration_ms)}
                </span>
              </div>

              {step.error_message && (
                <div className="mt-2.5 rounded-[9px] px-2.5 py-2 bg-[var(--danger-bg)] border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] text-body-sm text-[var(--danger)]">
                  {step.error_message}
                </div>
              )}

              <details className="mt-2.5">
                <summary className="knik-focus rounded-xs inline-flex items-center gap-1 cursor-pointer list-none text-caption text-fg-3 hover:text-[var(--acc-text)] transition-colors duration-base [&::-webkit-details-marker]:hidden">
                  <MS name="data_object" size={15} />
                  View inputs/outputs
                </summary>
                <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2">
                  <div className="min-w-0">
                    <div className="mb-1.5 text-micro font-semibold uppercase tracking-[.06em] text-fg-4">
                      Inputs
                    </div>
                    <CodeBlock
                      code={JSON.stringify(step.inputs, null, 2)}
                      language="json"
                      onCopy={onCopy}
                      className="max-h-48 overflow-auto"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1.5 text-micro font-semibold uppercase tracking-[.06em] text-fg-4">
                      Outputs
                    </div>
                    <CodeBlock
                      code={JSON.stringify(step.outputs, null, 2)}
                      language="json"
                      onCopy={onCopy}
                      className="max-h-48 overflow-auto"
                    />
                  </div>
                </div>
              </details>
            </div>
          </div>
        )
      })}
    </div>
  )
}
