import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react'
import type { Workflow, WorkflowDefinition } from '$types/workflow'
import type { DemoActionResult } from '$types/demo-session'

export interface WorkflowBuilderScope {
  workflowId?: string
  name: string
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  fieldDrafts: Record<string, string>
  error: string | null
}
export interface WorkflowHubScope {
  query: string
  filter: string
}
export type DefinitionResult =
  | { ok: true; definition: WorkflowDefinition }
  | { ok: false; error: string }
export interface WorkflowStore {
  workflows: Workflow[]
  scenarioDefinitions: Partial<Record<string, WorkflowDefinition>>
  builderScopes: Partial<Record<string, WorkflowBuilderScope>>
  hubScopes: Partial<Record<string, WorkflowHubScope>>
  initBuilder: (scope: string, workflowId?: string) => void
  disposeBuilder: (scope: string) => void
  patchBuilder: (scope: string, patch: Partial<WorkflowBuilderScope>) => void
  changeNodes: (scope: string, changes: NodeChange[]) => void
  changeEdges: (scope: string, changes: EdgeChange[]) => void
  connect: (scope: string, connection: Connection) => void
  addNode: (
    scope: string,
    type: string,
    position: { x: number; y: number },
    modelId?: string
  ) => void
  updateNode: (scope: string, id: string, data: Record<string, unknown>) => void
  setFieldDraft: (scope: string, field: string, value: string) => void
  validateBuilder: (scope: string) => DefinitionResult
  saveBuilder: (scope: string) => DemoActionResult
  initHub: (scope: string) => void
  disposeHub: (scope: string) => void
  patchHub: (scope: string, patch: Partial<WorkflowHubScope>) => void
}
