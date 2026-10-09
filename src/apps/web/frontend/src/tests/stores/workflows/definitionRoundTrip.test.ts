import { describe, expect, it } from 'vitest'
import { createDemoSeed } from '$stores/demo'
import { createWorkflowStore } from '$stores/workflows/store'
import { createExecutionStore } from '$stores/executions/store'
import { createRunWorkflowCommand } from '$stores/executions/actions'
import type { WorkflowDefinition } from '$types/workflow'

const PROMPT = 'Summarize the supplied input.'
const digest: WorkflowDefinition = {
  nodes: {
    start: { type: 'StartNode', label: 'Start' },
    summarize: { type: 'AIExecutionNode', model: 'demo-model', prompt: PROMPT },
    end: { type: 'EndNode', label: 'End' },
  },
  connections: [
    { from_id: 'start', to_id: 'summarize' },
    { from_id: 'summarize', to_id: 'end' },
  ],
}
const branch: WorkflowDefinition = {
  nodes: {
    check: { type: 'ConditionalBranchNode', condition: 'data.ok' },
    accept: { type: 'EndNode', label: 'Accepted' },
    reject: { type: 'EndNode', label: 'Rejected' },
  },
  connections: [
    { from_id: 'check', to_id: 'accept', condition: 'true' },
    { from_id: 'check', to_id: 'reject', condition: 'false' },
  ],
}
const scenario = (id: string, executionId: number) => ({
  execution: {
    id: executionId,
    workflow_id: id,
    workflow_name: id,
    status: 'success' as const,
    inputs: {},
    outputs: {},
    started_at: '2026-10-08T10:00:00Z',
  },
  timeline: [],
})

function setup() {
  const seed = createDemoSeed({
    workflows: [
      { id: 'digest', name: 'Digest', definition: digest },
      { id: 'branch', name: 'Branch', definition: branch },
    ],
    runScenarios: { digest: scenario('digest', 7), branch: scenario('branch', 8) },
  })
  const stores = { workflows: createWorkflowStore(seed), executions: createExecutionStore(seed) }
  const state = () => stores.workflows.getState()
  const saved = (id: string) => state().workflows.find(workflow => workflow.id === id)!.definition
  return { state, saved, run: createRunWorkflowCommand(stores) }
}

describe('builder definition round trips', () => {
  it('keeps a redrawn AI connection equal to the seeded one so Run stays available', () => {
    const { state, saved, run } = setup()
    state().initBuilder('editor', 'digest')
    const seeded = state().builderScopes.editor!.edges.find(edge => edge.source === 'summarize')!
    state().changeEdges('editor', [{ type: 'remove', id: seeded.id }])
    state().connect('editor', {
      source: 'summarize',
      sourceHandle: 'output',
      target: 'end',
      targetHandle: null,
    })
    expect(state().saveBuilder('editor')).toEqual({ ok: true, id: 'digest' })
    expect(saved('digest')).toEqual(digest)
    expect(run('digest')).toEqual({ ok: true, id: 7 })
  })

  it('keeps Run available after a prompt is edited and then restored', () => {
    const { state, saved, run } = setup()
    state().initBuilder('editor', 'digest')
    const data = () =>
      state().builderScopes.editor!.nodes.find(node => node.id === 'summarize')!.data
    state().updateNode('editor', 'summarize', { ...data(), systemPrompt: `${PROMPT} Edited.` })
    expect(state().validateBuilder('editor')).toMatchObject({
      ok: true,
      definition: { nodes: { summarize: { prompt: `${PROMPT} Edited.` } } },
    })
    state().updateNode('editor', 'summarize', { ...data(), systemPrompt: PROMPT })
    expect(state().saveBuilder('editor').ok).toBe(true)
    expect(saved('digest')).toEqual(digest)
    expect(saved('digest').nodes.summarize).not.toHaveProperty('systemPrompt')
    expect(run('digest')).toEqual({ ok: true, id: 7 })
  })

  it('round-trips conditional true and false branches through save and reopen', () => {
    const { state, saved, run } = setup()
    state().initBuilder('editor', 'branch')
    const seeded = state().builderScopes.editor!.edges.find(edge => edge.target === 'reject')!
    state().changeEdges('editor', [{ type: 'remove', id: seeded.id }])
    state().connect('editor', {
      source: 'check',
      sourceHandle: 'false',
      target: 'reject',
      targetHandle: null,
    })
    expect(state().saveBuilder('editor').ok).toBe(true)
    expect(saved('branch')).toEqual(branch)
    state().initBuilder('reopened', 'branch')
    expect(
      state().builderScopes.reopened!.edges.map(edge => [edge.target, edge.sourceHandle])
    ).toEqual([
      ['accept', 'true'],
      ['reject', 'false'],
    ])
    expect(run('branch')).toEqual({ ok: true, id: 8 })
  })

  it('rejects a second connection between the same two nodes', () => {
    const { state, saved } = setup()
    state().initBuilder('editor', 'branch')
    state().connect('editor', {
      source: 'check',
      sourceHandle: 'false',
      target: 'accept',
      targetHandle: null,
    })
    const message = 'Node check: only one connection to accept is allowed.'
    expect(state().builderScopes.editor!.error).toBe(message)
    expect(state().builderScopes.editor!.edges).toHaveLength(2)
    state().changeEdges('editor', [
      {
        type: 'add',
        item: { id: 'parallel', source: 'check', sourceHandle: 'false', target: 'accept' },
      },
    ])
    expect(state().saveBuilder('editor')).toEqual({ ok: false, error: message })
    expect(saved('branch')).toEqual(branch)
    state().changeEdges('editor', [{ type: 'remove', id: 'parallel' }])
    expect(state().saveBuilder('editor').ok).toBe(true)
    expect(state().builderScopes.editor!.error).toBeNull()
  })
})
