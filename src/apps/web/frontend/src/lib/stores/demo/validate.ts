import type { DemoSnapshot } from '$types/stores/demo'
import { workflowDefinitionToGraph } from '$lib/data-structures'

function uniqueIds(label: string, ids: (string | number)[]) {
  if (ids.some(id => String(id).trim() === '') || new Set(ids.map(String)).size !== ids.length)
    throw new Error(`Invalid demo source: ${label} must have unique, non-empty IDs.`)
}

export function validateDemoSource(seed: DemoSnapshot) {
  for (const key of [
    'conversations',
    'workflows',
    'schedules',
    'executions',
    'models',
    'providers',
    'voices',
    'apiKeys',
  ] as const)
    uniqueIds(
      key,
      seed[key].map(item => item.id)
    )
  uniqueIds(
    'tools',
    seed.tools.map(item => item.name)
  )
  uniqueIds(
    'suggestions',
    seed.suggestions.map(item => item.id)
  )
  const workflows = new Map(seed.workflows.map(workflow => [workflow.id, workflow]))
  for (const workflow of seed.workflows) {
    const { nodes, connections } = workflow.definition
    if (
      connections.some(
        edge => !Object.hasOwn(nodes, edge.from_id) || !Object.hasOwn(nodes, edge.to_id)
      )
    )
      throw new Error(`Invalid demo source: workflow ${workflow.id} references a missing node.`)
    if (workflowDefinitionToGraph(workflow.definition).hasCycle())
      throw new Error(`Invalid demo source: workflow ${workflow.id} contains a cycle.`)
  }
  for (const schedule of seed.schedules)
    if (!workflows.has(schedule.target_workflow_id))
      throw new Error(`Invalid demo source: schedule ${schedule.id} references a missing workflow.`)
  const executions = new Map(seed.executions.map(execution => [String(execution.id), execution]))
  const executionOwners = new Map(
    seed.executions.map(execution => [execution.id, execution.workflow_id])
  )
  for (const execution of seed.executions)
    if (!workflows.has(execution.workflow_id))
      throw new Error(
        `Invalid demo source: execution ${execution.id} references a missing workflow.`
      )
  for (const [id, timeline] of Object.entries(seed.timelines)) {
    const execution = executions.get(id)
    if (!execution) throw new Error(`Invalid demo source: timeline ${id} has no execution.`)
    const workflow = workflows.get(execution.workflow_id)
    if (workflow && timeline.some(step => !Object.hasOwn(workflow.definition.nodes, step.node_id)))
      throw new Error(`Invalid demo source: timeline ${id} references a missing node.`)
  }
  for (const [id, scenario] of Object.entries(seed.runScenarios)) {
    const workflow = workflows.get(id)
    if (!scenario) continue
    if (
      !workflow ||
      scenario.execution.workflow_id !== id ||
      scenario.timeline.some(step => !Object.hasOwn(workflow.definition.nodes, step.node_id))
    )
      throw new Error(`Invalid demo source: run scenario ${id} does not match its workflow.`)
    const owner = executionOwners.get(scenario.execution.id)
    if (owner !== undefined && owner !== id)
      throw new Error(
        `Invalid demo source: run scenario ${id} reuses another workflow's execution ID.`
      )
    executionOwners.set(scenario.execution.id, id)
  }
  for (const model of seed.models)
    if (model.providerId && !seed.providers.some(provider => provider.id === model.providerId))
      throw new Error(`Invalid demo source: model ${model.id} references a missing provider.`)
  for (const scenario of seed.chatScenarios)
    if (scenario.modelId && !seed.models.some(model => model.id === scenario.modelId))
      throw new Error(`Invalid demo source: chat scenario references a missing model.`)
  if (seed.settings.model && !seed.models.some(model => model.id === seed.settings.model))
    throw new Error(`Invalid demo source: settings select a missing model.`)
}

export function freezeSeed<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) freezeSeed(child)
  }
  return value
}
