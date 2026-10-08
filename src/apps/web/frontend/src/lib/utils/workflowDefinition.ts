import type { WorkflowDefinition } from '$types/workflow'
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)])
    )
  return value
}
export function definitionsMatch(
  a: WorkflowDefinition | undefined,
  b: WorkflowDefinition | undefined
) {
  return !!a && !!b && JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))
}
