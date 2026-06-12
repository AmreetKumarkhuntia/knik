/** Renders function node content showing name and parameter count. */
export function FunctionContent({ data }: { data: Record<string, unknown> }) {
  const functionName = data.function_name as string
  const params = data.params as Record<string, unknown> | undefined

  return (
    <>
      <p className="text-fg-3 text-xs truncate font-mono">{functionName || 'Unnamed'}</p>
      {params && Object.keys(params).length > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[10px] text-fg-3">data_object</span>
          <span className="text-fg-4 text-[10px]">{Object.keys(params).length} parameters</span>
        </div>
      )}
    </>
  )
}

/** Renders conditional branch node content with true/false labels. */
export function ConditionalContent({ data }: { data: Record<string, unknown> }) {
  const condition = data.condition as string

  return (
    <>
      <p className="text-fg-3 text-xs truncate font-mono bg-surface-3 rounded px-2 py-1">
        {condition || 'No condition'}
      </p>
      <div className="flex justify-between mt-3 gap-2">
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-[var(--success)] font-medium uppercase">True</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-[var(--danger)] font-medium uppercase">False</span>
        </div>
      </div>
    </>
  )
}

/** Renders merge node content showing the merge strategy. */
export function MergeContent({ data }: { data: Record<string, unknown> }) {
  const strategy = data.merge_strategy as string

  return (
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-[10px] text-fg-3">data_object</span>
      <p className="text-fg-3 text-xs font-mono">{strategy || 'concat'}</p>
    </div>
  )
}

/** Renders AI node content showing the model name. */
export function AIContent({ data }: { data: Record<string, unknown> }) {
  const model = data.model as string

  return (
    <>
      {model && <p className="text-fg-3 text-xs text-center">{model}</p>}
      <div className="flex justify-between w-full mt-2">
        <div className="h-2 w-2 rounded-full bg-surface-2 border border-[var(--border-2)]" />
        <div className="h-2 w-2 rounded-full bg-surface-2 border border-[var(--border-2)]" />
      </div>
    </>
  )
}

/** Selects and renders the appropriate node content based on the renderer type. */
export function NodeContent({
  renderer,
  data,
}: {
  renderer?: string
  data: Record<string, unknown>
}) {
  switch (renderer) {
    case 'function':
      return <FunctionContent data={data} />
    case 'conditional':
      return <ConditionalContent data={data} />
    case 'merge':
      return <MergeContent data={data} />
    case 'ai':
      return <AIContent data={data} />
    default:
      return null
  }
}
