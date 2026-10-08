import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import { StoresProvider } from '$stores'
import WorkflowHubWidget from '$widgets/workflows/WorkflowHubWidget'
import WorkflowBuilderWidget from '$widgets/workflows/WorkflowBuilderWidget'
import ExecutionDetailWidget from '$widgets/workflows/ExecutionDetailWidget'
import { normalizeNodes } from '$stores/workflows/selectors'

afterEach(cleanup)

describe('workflow session views', () => {
  it('shows absent workflow and execution routes explicitly', () => {
    render(
      <MemoryRouter>
        <StoresProvider source={{}}>
          <WorkflowBuilderWidget workflowId="missing" />
          <ExecutionDetailWidget executionId="not-a-number" />
        </StoresProvider>
      </MemoryRouter>
    )
    expect(screen.getByText('Workflow not found')).toBeTruthy()
    expect(screen.getByText('Execution not found')).toBeTruthy()
  })

  it('disables a run without a supplied scenario', () => {
    render(
      <MemoryRouter>
        <StoresProvider
          source={{
            workflows: [
              { id: 'one', name: 'Draft workflow', definition: { nodes: {}, connections: [] } },
            ],
          }}
        >
          <WorkflowHubWidget />
        </StoresProvider>
      </MemoryRouter>
    )
    expect(
      (screen.getByRole('button', { name: 'Run Draft workflow' }) as HTMLButtonElement).disabled
    ).toBe(true)
    expect(screen.getByText('No executions yet')).toBeTruthy()
  })

  it('discards route-local search while keeping the provider session', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <StoresProvider
          source={{
            workflows: [
              { id: 'one', name: 'Retained workflow', definition: { nodes: {}, connections: [] } },
            ],
          }}
        >
          <Routes>
            <Route path="/" element={<WorkflowHubWidget />} />
            <Route path="/workflows/create" element={<Link to="/">Return to workflows</Link>} />
          </Routes>
        </StoresProvider>
      </MemoryRouter>
    )
    await user.type(screen.getByRole('textbox', { name: 'Search workflows' }), 'unmatched query')
    expect(screen.getByText('No matching workflows')).toBeTruthy()
    await user.click(screen.getByRole('link', { name: 'New workflow' }))
    await user.click(screen.getByRole('link', { name: 'Return to workflows' }))
    expect(screen.getByRole('link', { name: 'Retained workflow' })).toBeTruthy()
    expect(
      (screen.getByRole('textbox', { name: 'Search workflows' }) as HTMLInputElement).value
    ).toBe('')
  })

  it('uses a supplied run result and navigates to that execution', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <StoresProvider
          source={{
            workflows: [
              { id: 'one', name: 'Draft workflow', definition: { nodes: {}, connections: [] } },
            ],
            runScenarios: {
              one: {
                execution: {
                  id: 7,
                  workflow_id: 'one',
                  workflow_name: 'Draft workflow',
                  status: 'success',
                  inputs: {},
                  outputs: { answer: 'provided' },
                  started_at: '2026-10-08T10:00:00Z',
                },
                timeline: [],
              },
            },
          }}
        >
          <Routes>
            <Route path="/" element={<WorkflowHubWidget />} />
            <Route path="/executions/:id" element={<div>Supplied execution route</div>} />
          </Routes>
        </StoresProvider>
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: 'Run Draft workflow' }))
    expect(screen.getByText('Supplied execution route')).toBeTruthy()
  })
})

describe('workflow draft serialization', () => {
  it('preserves terminal node types and converts JSON parameter drafts', () => {
    const draft = [
      {
        id: 'start',
        type: 'StartNode',
        position: { x: 0, y: 0 },
        data: { label: 'Start', mode: 'edit' },
      },
      {
        id: 'function',
        type: 'FunctionExecutionNode',
        position: { x: 1, y: 1 },
        data: { function_name: 'summarize', params: '{"limit":3}', mode: 'edit' },
      },
    ]
    const normalized = normalizeNodes(draft)
    expect(normalized[0].data).toEqual({ type: 'StartNode', label: 'Start' })
    expect(normalized[1].data.params).toEqual({ limit: 3 })
    expect(draft[1].data.params).toBe('{"limit":3}')
  })

  it('retains malformed JSON in the draft and rejects saving it', () => {
    const draft = [
      {
        id: 'broken',
        type: 'FunctionExecutionNode',
        position: { x: 0, y: 0 },
        data: { params: '{unfinished' },
      },
    ]
    expect(() => normalizeNodes(draft)).toThrow('Parameters must be a valid JSON object')
    expect(draft[0].data.params).toBe('{unfinished')
  })
})
