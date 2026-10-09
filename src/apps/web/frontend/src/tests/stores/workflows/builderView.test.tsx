import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { graphToWorkflowDefinition } from '$lib/data-structures'
import { StoresProvider } from '$stores'
import { useWorkflowBuilderView } from '$stores/views'
import type { DemoSource } from '$types/demo-session'

vi.mock('$lib/data-structures', async importOriginal => {
  const actual = await importOriginal<typeof import('$lib/data-structures')>()
  return { ...actual, graphToWorkflowDefinition: vi.fn(actual.graphToWorkflowDefinition) }
})

const PROMPT = 'Summarize the supplied input.'
const source: DemoSource = {
  workflows: [
    {
      id: 'digest',
      name: 'Digest',
      definition: {
        nodes: {
          start: { type: 'StartNode', label: 'Start' },
          summarize: { type: 'AIExecutionNode', model: 'demo-model', prompt: PROMPT },
        },
        connections: [{ from_id: 'start', to_id: 'summarize' }],
      },
    },
  ],
  runScenarios: {
    digest: {
      execution: {
        id: 7,
        workflow_id: 'digest',
        workflow_name: 'Digest',
        status: 'success',
        inputs: {},
        outputs: {},
        started_at: '2026-10-08T10:00:00Z',
      },
      timeline: [],
    },
  },
}
const wrapper = ({ children }: { children: ReactNode }) => (
  <StoresProvider source={source}>{children}</StoresProvider>
)

describe('workflow builder run availability', () => {
  it('rechecks the draft definition only when a node or edge changes, not while dragging', () => {
    const { result } = renderHook(() => useWorkflowBuilderView('digest'), { wrapper })
    expect(result.current.canRun).toBe(true)
    const conversions = vi.mocked(graphToWorkflowDefinition).mock.calls.length
    for (const x of [10, 20, 30])
      act(() =>
        result.current.changeNodes([
          { id: 'start', type: 'position', position: { x, y: 0 }, dragging: true },
        ])
      )
    act(() => result.current.selectNode('start'))
    act(() => result.current.setName('Renamed digest'))
    expect(result.current.draft!.nodes[0].position).toEqual({ x: 30, y: 0 })
    expect(graphToWorkflowDefinition).toHaveBeenCalledTimes(conversions)
    expect(result.current.canRun).toBe(true)

    const data = () => result.current.draft!.nodes.find(node => node.id === 'summarize')!.data
    act(() => result.current.updateNode('summarize', { ...data(), systemPrompt: 'Edited' }))
    expect(result.current.canRun).toBe(false)
    act(() => result.current.updateNode('summarize', { ...data(), systemPrompt: PROMPT }))
    expect(result.current.canRun).toBe(true)
  })
})
