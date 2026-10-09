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

export function FunctionContent({ data }: { data: Record<string, unknown> }) {
  const functionName = data.function_name as string
  const parameterCount = countParameters(data.params)

  return (
    <>
      <p className="graph-node__detail font-mono" title={functionName}>
        {functionName || 'Unnamed function'}
      </p>
      {parameterCount > 0 && (
        <span className="graph-node__support">
          {parameterCount} {parameterCount === 1 ? 'parameter' : 'parameters'}
        </span>
      )}
    </>
  )
}

export function ConditionalContent({ data }: { data: Record<string, unknown> }) {
  const condition = data.condition as string
  return (
    <p className="graph-node__detail font-mono" title={condition}>
      {condition || 'No condition'}
    </p>
  )
}

export function MergeContent({ data }: { data: Record<string, unknown> }) {
  const strategy = data.merge_strategy as string
  return <p className="graph-node__detail">{strategy || 'concat'}</p>
}

export function AIContent({ data }: { data: Record<string, unknown> }) {
  const model = data.model as string
  return (
    <p className="graph-node__detail" title={model}>
      {model || 'No model selected'}
    </p>
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
