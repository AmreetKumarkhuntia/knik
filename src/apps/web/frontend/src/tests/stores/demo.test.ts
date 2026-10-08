import { describe, expect, it } from 'vitest'
import { bundledDemoSource, createDemoSeed } from '$lib/stores/demo'
import { validateDemoSource } from '$lib/stores/demo/validate'
import { createStoreBundle } from '$lib/stores/session/createStoreBundle'

describe('canonical demo seed', () => {
  it('contains complete connected sample workflows, chat scenarios and execution timelines', () => {
    const seed = createDemoSeed()
    expect(() => validateDemoSource(seed)).not.toThrow()
    expect(Object.isFrozen(seed)).toBe(true)
    expect(Object.isFrozen(seed.workflows[0].definition.nodes)).toBe(true)
    for (const workflow of seed.workflows) {
      expect(workflow.definition.nodes.start.type).toBe('StartNode')
      expect(workflow.definition.nodes.end.type).toBe('EndNode')
      expect(workflow.definition.connections).not.toHaveLength(0)
      const scenario = seed.runScenarios[workflow.id]
      expect(scenario?.execution.workflow_id).toBe(workflow.id)
      expect(scenario?.timeline).not.toHaveLength(0)
    }
    expect(seed.chatScenarios).not.toHaveLength(0)
    expect(seed.conversations.every(conversation => conversation.messages.length > 0)).toBe(true)
    expect(
      seed.models.every(model => seed.providers.some(provider => provider.id === model.providerId))
    ).toBe(true)
    expect(seed.keyScenarios).toEqual([])
    expect(seed.voices.every(voice => voice.audioSrc === undefined)).toBe(true)
  })

  it('rejects duplicate identities and broken schedule/scenario relationships before exposing stores', () => {
    expect(() =>
      createDemoSeed({
        providers: [
          { id: 'p', name: 'One' },
          { id: 'p', name: 'Two' },
        ],
      })
    ).toThrow('unique')
    expect(() =>
      createDemoSeed({
        schedules: [{ id: 1, target_workflow_id: 'missing', enabled: true, timezone: 'UTC' }],
      })
    ).toThrow('missing workflow')
    const source = structuredClone(bundledDemoSource)
    source.runScenarios!['wf-1']!.timeline[0].node_id = 'missing'
    expect(() => createDemoSeed(source)).toThrow('does not match')
  })

  it('normalizes a missing active conversation and clones every provider source independently', () => {
    const seed = createDemoSeed({ activeConversationId: 'missing' })
    expect(seed.activeConversationId).toBeNull()
    const source = structuredClone(bundledDemoSource)
    const original = structuredClone(source)
    const first = createStoreBundle(source),
      second = createStoreBundle(source)
    first.chat.getState().renameConversation('1', 'Changed')
    expect(first.chat.getState().conversations[0].title).toBe('Changed')
    expect(second.chat.getState().conversations[0].title).not.toBe('Changed')
    expect(source).toEqual(original)
  })

  it('rejects dangling executions, graph edges, cycles and model scenarios', () => {
    const executions = structuredClone(bundledDemoSource)
    executions.executions![0].workflow_id = 'missing'
    expect(() => createDemoSeed(executions)).toThrow('missing workflow')

    const edges = structuredClone(bundledDemoSource)
    edges.workflows![0].definition.connections[0].to_id = 'missing'
    expect(() => createDemoSeed(edges)).toThrow('missing node')

    const cycle = structuredClone(bundledDemoSource)
    cycle.workflows![0].definition.connections.push({ from_id: 'end', to_id: 'start' })
    expect(() => createDemoSeed(cycle)).toThrow('contains a cycle')

    expect(() =>
      createDemoSeed({ chatScenarios: [{ prompt: 'hello', modelId: 'missing', replies: [] }] })
    ).toThrow('missing model')
  })

  it('prevents a run scenario from overwriting another workflow’s execution', () => {
    const historyCollision = structuredClone(bundledDemoSource)
    historyCollision.runScenarios!['wf-1']!.execution.id = historyCollision.executions!.find(
      item => item.workflow_id === 'wf-2'
    )!.id
    expect(() => createDemoSeed(historyCollision)).toThrow('another workflow')

    const scenarioCollision = structuredClone(bundledDemoSource)
    scenarioCollision.executions = []
    scenarioCollision.timelines = {}
    scenarioCollision.runScenarios!['wf-1']!.execution.id =
      scenarioCollision.runScenarios!['wf-2']!.execution.id
    expect(() => createDemoSeed(scenarioCollision)).toThrow('another workflow')
  })

  it('saves messages with unavailable models and replays only matching authored replies', () => {
    const bundle = createStoreBundle({
      models: [{ id: 'm', label: 'Model', vendor: 'Example' }],
      chatScenarios: [
        {
          prompt: 'hello',
          modelId: 'm',
          replies: [
            {
              role: 'assistant',
              content: 'Authored reply',
              timestamp: '2026-10-08T09:00:01Z',
              metadata: {},
            },
          ],
        },
      ],
    })
    bundle.chat.getState().initializeScope('composer')
    bundle.chat.getState().patchScope('composer', { draft: 'hello' })
    bundle.settings.getState().updateSettings({ model: 'missing' })
    expect(bundle.commands.sendMessage('composer')).toMatchObject({ ok: true })
    expect(
      bundle.chat.getState().conversations[0].messages.map(message => message.content)
    ).toEqual(['hello'])
    expect(bundle.chat.getState().scopes.composer?.draft).toBe('')
    bundle.settings.getState().updateSettings({ model: '' })
    bundle.chat.getState().patchScope('composer', { draft: 'hello' })
    expect(bundle.commands.sendMessage('composer')).toMatchObject({ ok: true })
    expect(bundle.chat.getState().conversations).toHaveLength(1)
    expect(
      bundle.chat.getState().conversations[0].messages.map(message => message.content)
    ).toEqual(['hello', 'hello', 'Authored reply'])
  })
})
