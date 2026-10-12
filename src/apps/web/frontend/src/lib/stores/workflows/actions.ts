import type { StoreApi } from 'zustand/vanilla'
import type {
  WorkflowStore,
  DefinitionResult,
  WorkflowBuilderScope,
  WorkflowHubScope,
} from '$types/stores/workflows'
import { scopeSlice } from '../session/scopes'
import {
  canvasToDefinition,
  createHubScope,
  definitionToCanvas,
  duplicateConnectionError,
} from './selectors'
import { getDefaultNodeData } from '$lib/constants/nodes'
import { generateId } from '$utils/uuid'
import { addEdge, applyEdgeChanges, applyNodeChanges } from './graphChanges'

export function workflowActions(
  set: StoreApi<WorkflowStore>['setState'],
  get: StoreApi<WorkflowStore>['getState']
): Omit<WorkflowStore, 'workflows' | 'scenarioDefinitions' | 'builderScopes' | 'hubScopes'> {
  const builders = scopeSlice<WorkflowStore, WorkflowBuilderScope>(set, 'builderScopes')
  const hubs = scopeSlice<WorkflowStore, WorkflowHubScope>(set, 'hubScopes')
  const patch = builders.patch
  const validate = (scope: string): DefinitionResult => {
    const draft = get().builderScopes[scope]
    if (!draft) return { ok: false, error: 'The workflow editor is no longer open.' }
    const result = canvasToDefinition(draft.nodes, draft.edges)
    if (!result.ok) return builders.fail(scope, result.error)
    patch(scope, { error: null })
    return result
  }
  return {
    initBuilder: (scope, workflowId) => {
      const workflow = get().workflows.find(item => item.id === workflowId)
      const { nodes, edges } = definitionToCanvas(workflow?.definition)
      builders.init(scope, {
        workflowId,
        name: workflow?.name ?? 'Untitled workflow',
        nodes: nodes.map(node => ({
          ...node,
          position: workflow?.canvasPositions?.[node.id] ?? node.position,
        })),
        edges,
        selectedNodeId: null,
        fieldDrafts: {},
        error: null,
      })
    },
    disposeBuilder: builders.dispose,
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
      if (!draft) return
      if (
        draft.edges.some(
          edge => edge.source === connection.source && edge.target === connection.target
        )
      )
        patch(scope, { error: duplicateConnectionError(connection) })
      else
        patch(scope, {
          edges: addEdge({ ...connection, type: 'custom', data: { mode: 'edit' } }, draft.edges),
        })
    },
    addNode: (scope, type, position, modelId) => {
      const draft = get().builderScopes[scope]
      if (!draft) return
      const node = {
        id: generateId(),
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
      if (!draft.name.trim()) return builders.fail(scope, 'Enter a workflow name.')
      const existing = get().workflows.find(workflow => workflow.id === draft.workflowId)
      if (draft.workflowId && !existing) return builders.fail(scope, 'Workflow no longer exists.')
      const result = validate(scope)
      if (!result.ok) return result
      const id = draft.workflowId ?? generateId()
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
      }))
      patch(scope, { workflowId: id, name: record.name, error: null })
      return { ok: true, id }
    },
    initHub: scope => hubs.init(scope, createHubScope()),
    disposeHub: hubs.dispose,
    patchHub: hubs.patch,
  }
}
