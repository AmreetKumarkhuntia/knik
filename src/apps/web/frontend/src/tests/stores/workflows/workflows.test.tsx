import { StrictMode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDemoSeed } from '$stores/demo'
import { createWorkflowStore } from '$stores/workflows/store'
import { StoresProvider } from '$stores'
import { useWorkflowBuilderView, useWorkflowHubView } from '$stores/views'
import type { DemoSource } from '$types/demo-session'

const source: DemoSource = {
  workflows: [
    {
      id: 'one',
      name: 'Original workflow',
      definition: {
        nodes: {
          start: { type: 'StartNode', label: 'Start' },
          end: { type: 'EndNode', label: 'End' },
        },
        connections: [{ from_id: 'start', to_id: 'end' }],
      },
    },
  ],
}
afterEach(cleanup)
describe('workflow store ownership', () => {
  it('keeps editors independent and commits without mutating another provider or the source', () => {
    const seed = createDemoSeed(source)
    const first = createWorkflowStore(seed)
    const second = createWorkflowStore(seed)
    first.getState().initBuilder('editor-a', 'one')
    first.getState().initBuilder('editor-b', 'one')
    first.getState().patchBuilder('editor-a', { name: 'Saved name' })
    first
      .getState()
      .changeNodes('editor-a', [{ id: 'start', type: 'position', position: { x: 25, y: 45 } }])
    expect(first.getState().builderScopes['editor-b']!.nodes[0].position).toEqual({
      x: 100,
      y: 200,
    })
    expect(first.getState().saveBuilder('editor-a')).toEqual({ ok: true, id: 'one' })
    expect(first.getState().workflows[0].name).toBe('Saved name')
    first.getState().initBuilder('editor-c', 'one')
    expect(first.getState().builderScopes['editor-c']!.nodes[0].position).toEqual({ x: 25, y: 45 })
    expect(first.getState().builderScopes['editor-b']!.name).toBe('Original workflow')
    expect(second.getState().workflows[0].name).toBe('Original workflow')
    expect(seed.workflows[0].name).toBe('Original workflow')
  })
  it('retains invalid data and errors until the scoped editor is disposed', () => {
    const store = createWorkflowStore(createDemoSeed(source))
    store.getState().initBuilder('editor', 'one')
    store.getState().addNode('editor', 'FunctionExecutionNode', { x: 0, y: 0 })
    const added = store.getState().builderScopes.editor!.nodes.at(-1)!
    store
      .getState()
      .updateNode('editor', added.id, { function_name: 'parse', params: '{unfinished' })
    expect(store.getState().saveBuilder('editor').ok).toBe(false)
    expect(store.getState().builderScopes.editor!.error).toContain(
      'Parameters must be a valid JSON object'
    )
    expect(store.getState().builderScopes.editor!.nodes[2].data.params).toBe('{unfinished')
    expect(store.getState().workflows[0].definition.nodes[added.id]).toBeUndefined()
    store.getState().disposeBuilder('editor')
    expect(store.getState().builderScopes.editor).toBeUndefined()
    store.getState().initBuilder('editor', 'one')
    expect(store.getState().builderScopes.editor!.nodes).toHaveLength(2)
  })
  it('initializes safely in StrictMode and discards a draft on unmount', () => {
    function Editor() {
      const view = useWorkflowBuilderView('one')
      return (
        <input
          aria-label="Draft name"
          value={view.draft?.name ?? ''}
          onChange={event => view.setName(event.target.value)}
        />
      )
    }
    const wrapper = (visible: boolean) => (
      <StrictMode>
        <StoresProvider source={source}>{visible && <Editor />}</StoresProvider>
      </StrictMode>
    )
    const view = render(wrapper(true))
    fireEvent.change(screen.getByRole('textbox', { name: 'Draft name' }), {
      target: { value: 'Discard this draft' },
    })
    expect(screen.getByDisplayValue('Discard this draft')).toBeTruthy()
    view.rerender(wrapper(false))
    view.rerender(wrapper(true))
    expect(screen.getByDisplayValue('Original workflow')).toBeTruthy()
  })
  it('uses only catalog models when adding AI nodes', () => {
    function Editor() {
      const view = useWorkflowBuilderView('one')
      return (
        <>
          <button onClick={() => view.addNode('AIExecutionNode', { x: 0, y: 0 })}>
            Add AI node
          </button>
          <output aria-label="Selected model">{String(view.selectedNode?.data.model ?? '')}</output>
          <output aria-label="Available models">
            {view.modelOptions.map(model => model.label).join(', ')}
          </output>
        </>
      )
    }
    render(
      <StoresProvider
        source={{
          ...source,
          models: [{ id: 'catalog-model', label: 'Supplied catalog model' }],
          settings: { model: 'catalog-model' },
        }}
      >
        <Editor />
      </StoresProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add AI node' }))
    expect(screen.getByLabelText('Selected model').textContent).toBe('catalog-model')
    expect(screen.getByLabelText('Available models').textContent).toBe('Supplied catalog model')
  })
  it('leaves AI model selection empty when no catalog model exists', () => {
    function Editor() {
      const view = useWorkflowBuilderView('one')
      return (
        <>
          <button onClick={() => view.addNode('AIExecutionNode', { x: 0, y: 0 })}>
            Add AI node
          </button>
          <output aria-label="Selected model">{String(view.selectedNode?.data.model ?? '')}</output>
        </>
      )
    }
    render(
      <StoresProvider source={source}>
        <Editor />
      </StoresProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add AI node' }))
    expect(screen.getByLabelText('Selected model').textContent).toBe('')
  })
  it('does not rerender the workflow hub or another editor when a draft changes', () => {
    const hubRender = vi.fn()
    const secondRender = vi.fn()
    function Hub() {
      useWorkflowHubView()
      hubRender()
      return null
    }
    function FirstEditor() {
      const view = useWorkflowBuilderView('one')
      return <button onClick={() => view.setName('Working draft')}>Edit first draft</button>
    }
    function SecondEditor() {
      const view = useWorkflowBuilderView('one')
      secondRender()
      return <output>{view.draft?.name}</output>
    }
    render(
      <StoresProvider source={source}>
        <Hub />
        <FirstEditor />
        <SecondEditor />
      </StoresProvider>
    )
    const hubCount = hubRender.mock.calls.length
    const secondCount = secondRender.mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: 'Edit first draft' }))
    expect(hubRender).toHaveBeenCalledTimes(hubCount)
    expect(secondRender).toHaveBeenCalledTimes(secondCount)
    expect(screen.getByText('Original workflow')).toBeTruthy()
  })
})
