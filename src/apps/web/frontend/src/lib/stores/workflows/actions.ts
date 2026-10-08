import type { StoreApi } from 'zustand/vanilla'
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import type { WorkflowStore, DefinitionResult } from '$types/stores/workflows'
import {
  canvasNodesToGraph,
  graphToWorkflowDefinition,
  validateWorkflowGraph,
} from '$lib/data-structures'
import { definitionToCanvas, normalizeNodes } from './selectors'
import { getDefaultNodeData } from '$lib/constants/nodes'

export function workflowActions(
  set: StoreApi<WorkflowStore>['setState'],
  get: StoreApi<WorkflowStore>['getState']
): Omit<WorkflowStore, 'workflows' | 'scenarioDefinitions' | 'builderScopes' | 'hubScopes'> {
  const patch: WorkflowStore['patchBuilder'] = (scope, updates) =>
    set(state =>
      state.builderScopes[scope]
        ? {
            builderScopes: {
              ...state.builderScopes,
              [scope]: { ...state.builderScopes[scope], ...updates },
            },
          }
        : {}
    )
  const validate = (scope: string): DefinitionResult => {
    const draft = get().builderScopes[scope]
    if (!draft) return { ok: false, error: 'The workflow editor is no longer open.' }
    try {
      const graph = canvasNodesToGraph(normalizeNodes(draft.nodes), draft.edges)
      const validation = validateWorkflowGraph(graph)
      if (validation.errors.length) throw new Error(validation.errors.join('\n'))
      patch(scope, { error: null })
      return { ok: true, definition: graphToWorkflowDefinition(graph) }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not validate workflow.'
      patch(scope, { error: message })
      return { ok: false, error: message }
    }
  }
  return {
    initBuilder: (scope, workflowId) => {
      if (get().builderScopes[scope]) return
      const workflow = get().workflows.find(item => item.id === workflowId)
      set(state => ({
        builderScopes: {
          ...state.builderScopes,
          [scope]: {
            workflowId,
            name: workflow?.name ?? 'Untitled workflow',
            ...definitionToCanvas(workflow?.definition),
            nodes: definitionToCanvas(workflow?.definition).nodes.map(node => ({
              ...node,
              position: workflow?.canvasPositions?.[node.id] ?? node.position,
            })),
            selectedNodeId: null,
            fieldDrafts: {},
            error: null,
          },
        },
      }))
    },
    disposeBuilder: scope =>
      set(state => {
        const next = { ...state.builderScopes }
        delete next[scope]
        return { builderScopes: next }
      }),
    patchBuilder: patch,
    changeNodes: (scope, changes) => {
      const draft = get().builderScopes[scope]
      if (draft) patch(scope, { nodes: applyNodeChanges(changes, draft.nodes) })
    },
    changeEdges: (scope, changes) => {
      const draft = get().builderScopes[scope]
      if (draft) patch(scope, { edges: applyEdgeChanges(changes, draft.edges) })
    },
    connect: (scope, connection) => {
      const draft = get().builderScopes[scope]
      if (draft)
        patch(scope, {
          edges: addEdge({ ...connection, type: 'custom', data: { mode: 'edit' } }, draft.edges),
        })
    },
    addNode: (scope, type, position, modelId) => {
      const draft = get().builderScopes[scope]
      if (!draft) return
      const node = {
        id: crypto.randomUUID(),
        type,
        position,
        data: {
          ...structuredClone(getDefaultNodeData(type)),
          type,
          mode: 'edit',
          ...(type === 'AIExecutionNode' ? { model: modelId ?? '' } : {}),
        },
      }
      patch(scope, { nodes: [...draft.nodes, node], selectedNodeId: node.id })
    },
    updateNode: (scope, id, data) => {
      const draft = get().builderScopes[scope]
      if (draft)
        patch(scope, {
          nodes: draft.nodes.map(node =>
            node.id === id ? { ...node, data: structuredClone(data) } : node
          ),
        })
    },
    setFieldDraft: (scope, field, value) => {
      const draft = get().builderScopes[scope]
      if (draft) patch(scope, { fieldDrafts: { ...draft.fieldDrafts, [field]: value } })
    },
    validateBuilder: validate,
    saveBuilder: scope => {
      const draft = get().builderScopes[scope]
      if (!draft) return { ok: false, error: 'The workflow editor is no longer open.' }
      if (!draft.name.trim()) {
        patch(scope, { error: 'Enter a workflow name.' })
        return { ok: false, error: 'Enter a workflow name.' }
      }
      const existing = get().workflows.find(workflow => workflow.id === draft.workflowId)
      if (draft.workflowId && !existing) {
        patch(scope, { error: 'Workflow no longer exists.' })
        return { ok: false, error: 'Workflow no longer exists.' }
      }
      const result = validate(scope)
      if (!result.ok) return result
      const id = draft.workflowId ?? crypto.randomUUID()
      const now = new Date().toISOString()
      const record = {
        ...existing,
        id,
        name: draft.name.trim(),
        definition: result.definition,
        canvasPositions: Object.fromEntries(
          draft.nodes.map(node => [node.id, { ...node.position }])
        ),
        created_at: existing?.created_at ?? now,
        updated_at: now,
      }
      set(state => ({
        workflows: existing
          ? state.workflows.map(workflow => (workflow.id === id ? record : workflow))
          : [...state.workflows, record],
        builderScopes: {
          ...state.builderScopes,
          [scope]: { ...draft, workflowId: id, name: record.name, error: null },
        },
      }))
      return { ok: true, id }
    },
    initHub: scope => {
      if (!get().hubScopes[scope])
        set(state => ({ hubScopes: { ...state.hubScopes, [scope]: { filter: 'all', query: '' } } }))
    },
    disposeHub: scope =>
      set(state => {
        const next = { ...state.hubScopes }
        delete next[scope]
        return { hubScopes: next }
      }),
    patchHub: (scope, updates) =>
      set(state =>
        state.hubScopes[scope]
          ? {
              hubScopes: { ...state.hubScopes, [scope]: { ...state.hubScopes[scope], ...updates } },
            }
          : {}
      ),
  }
}
