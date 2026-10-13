import type { ReactNode } from 'react'

// The builder keeps edited params as raw JSON text until save, so count keys only once it parses.
function countParameters(params: unknown): number {
  let value = params
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return 0
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).length : 0
}

function DetailRow({
  name,
  title,
  children,
}: {
  name: string
  title?: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-2 min-w-0 text-caption">
      <span className="w-[52px] shrink-0 text-fg-4">{name}</span>
      <span className="graph-node__detail min-w-0" title={title}>
        {children}
      </span>
    </div>
  )
}

export function FunctionContent({ data }: { data: Record<string, unknown> }) {
  const functionName = data.function_name as string
  const parameterCount = countParameters(data.params)

  return (
    <>
      <DetailRow name="fn" title={functionName}>
        {functionName || 'Unnamed function'}
      </DetailRow>
      {parameterCount > 0 && (
        <DetailRow name="params">
          {parameterCount} {parameterCount === 1 ? 'parameter' : 'parameters'}
        </DetailRow>
      )}
    </>
  )
}

export function ConditionalContent({ data }: { data: Record<string, unknown> }) {
  const condition = data.condition as string
  return (
    <DetailRow name="if" title={condition}>
      {condition || 'No condition'}
    </DetailRow>
  )
}

export function MergeContent({ data }: { data: Record<string, unknown> }) {
  const strategy = data.merge_strategy as string
  return <DetailRow name="strategy">{strategy || 'concat'}</DetailRow>
}

export function AIContent({ data }: { data: Record<string, unknown> }) {
  const model = data.model as string
  return (
    <DetailRow name="model" title={model}>
      {model || 'No model selected'}
    </DetailRow>
  )
}

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
