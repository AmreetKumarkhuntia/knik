import { describe, expect, it } from 'vitest'
import { createDemoSeed } from '$stores/demo'
import { createWorkflowStore } from '$stores/workflows/store'
import { createExecutionStore } from '$stores/executions/store'
import { createRunWorkflowCommand } from '$stores/executions/actions'
function setup() {
  const seed = createDemoSeed({
    workflows: [
      {
        id: 'one',
        name: 'Workflow',
        definition: { nodes: { start: { type: 'StartNode' } }, connections: [] },
      },
    ],
    runScenarios: {
      one: {
        execution: {
          id: 7,
          workflow_id: 'one',
          workflow_name: 'Workflow',
          status: 'success',
          inputs: {},
          outputs: { supplied: true },
          started_at: '2026-10-08T10:00:00Z',
        },
        timeline: [
          {
            node_id: 'start',
            node_type: 'StartNode',
            status: 'success',
            inputs: {},
            outputs: {},
            started_at: '2026-10-08T10:00:00Z',
          },
        ],
      },
    },
  })
  const stores = { workflows: createWorkflowStore(seed), executions: createExecutionStore(seed) }
  return { ...stores, run: createRunWorkflowCommand(stores), seed }
}
describe('execution store scenarios', () => {
  it('commits the supplied execution and its timeline in one notification', () => {
    const stores = setup()
    const snapshots: Array<{ executions: number; timeline: number }> = []
    stores.executions.subscribe(state =>
      snapshots.push({
        executions: state.executions.length,
        timeline: state.timelines['7']?.length ?? 0,
      })
    )
    expect(stores.run('one')).toEqual({ ok: true, id: 7 })
    expect(snapshots).toEqual([{ executions: 1, timeline: 1 }])
    expect(stores.seed.executions).toHaveLength(0)
    expect(stores.seed.timelines['7']).toBeUndefined()
  })
  it('rejects runs after editing the definition without writing any result', () => {
    const stores = setup()
    stores.workflows.getState().initBuilder('editor', 'one')
    stores.workflows
      .getState()
      .updateNode('editor', 'start', { type: 'StartNode', label: 'Changed' })
    expect(stores.workflows.getState().saveBuilder('editor').ok).toBe(true)
    expect(stores.run('one').ok).toBe(false)
    expect(stores.executions.getState().executions).toHaveLength(0)
    expect(stores.executions.getState().timelines).toEqual({})
  })
  it('discards view filters without deleting committed results', () => {
    const stores = setup()
    stores.run('one')
    stores.executions.getState().initScope('list')
    stores.executions.getState().patchScope('list', { page: 2, status: 'failed' })
    stores.executions.getState().disposeScope('list')
    stores.executions.getState().initScope('list')
    expect(stores.executions.getState().scopes.list).toMatchObject({ page: 1, status: 'all' })
    expect(stores.executions.getState().executions).toHaveLength(1)
  })
})
