import type {
  WorkflowDefinition,
  NodeDefinition,
  WorkflowConnection,
  WorkflowValidationResult,
} from '$types/workflow'
import { Graph } from '../structures/Graph'
import type { WorkflowGraphOptions } from '../types'

export function workflowDefinitionToGraph(
  definition: WorkflowDefinition,
  options: WorkflowGraphOptions = {}
): Graph<NodeDefinition> {
  const { mode = 'edit', executionData } = options

  const graph = new Graph<NodeDefinition>({ directed: true, weighted: false })

  Object.entries(definition.nodes).forEach(([nodeId, nodeDef]) => {
    const execData = executionData?.get(nodeId)

    const config: Record<string, unknown> = {
      ...nodeDef,
      mode,
    }

    if (mode === 'execution' && execData) {
      config.status = execData.status
      config.duration = execData.duration
      config.inputs = execData.inputs
      config.outputs = execData.outputs
      config.error_message = execData.error_message
    }

    graph.addNode(nodeDef, nodeId, config)
  })

  definition.connections.forEach((conn: WorkflowConnection) => {
    graph.addEdge(conn.from_id, conn.to_id)

    const fromNode = graph.getNode(conn.from_id)
    if (fromNode && conn.condition) {
      if (!fromNode.config.conditions) {
        fromNode.config.conditions = {}
      }
      ;(fromNode.config.conditions as Record<string, string>)[conn.to_id] = conn.condition
    }
  })

  return graph
}

export function graphToWorkflowDefinition<T>(graph: Graph<T>): WorkflowDefinition {
  const nodes: Record<string, NodeDefinition> = {}
  const connections: WorkflowConnection[] = []

  graph.getNodes().forEach(node => {
    const nodeDef = node.value as unknown as NodeDefinition

    nodes[node.id] = nodeDef
  })

  graph.getEdges().forEach(edge => {
    const fromNode = graph.getNode(edge.from)
    const conditions = fromNode?.config.conditions as Record<string, string> | undefined
    const condition = conditions?.[edge.to]

    connections.push({
      from_id: edge.from,
      to_id: edge.to,
      condition,
    })
  })

  return { nodes, connections }
}

export function validateWorkflowGraph(graph: Graph<unknown>): WorkflowValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (graph.getNodes().length === 0) {
    errors.push('Workflow must have at least one node')
  }

  if (graph.hasCycle()) {
    errors.push('Workflow contains a cycle')
  }

  const topSort = graph.topologicalSort()
  if (!topSort) {
    errors.push('Cannot determine execution order (workflow may contain cycles)')
  }

  const nodes = graph.getNodes()
  const hasStartNode = nodes.some(n => (n.config.type as string) === 'StartNode')
  const hasEndNode = nodes.some(n => (n.config.type as string) === 'EndNode')

  if (!hasStartNode) {
    warnings.push('Workflow does not have a Start node')
  }

  if (!hasEndNode) {
    warnings.push('Workflow does not have an End node')
  }

  nodes.forEach(node => {
    const nodeType = node.config.type as string

    if (nodeType === 'FunctionExecutionNode') {
      if (!node.config.function_name) {
        errors.push(`Node ${node.id}: function_name is required`)
      }
    }

    if (nodeType === 'ConditionalBranchNode') {
      if (!node.config.condition) {
        errors.push(`Node ${node.id}: condition is required`)
      }
    }

    if (nodeType === 'AIExecutionNode') {
      if (!node.config.prompt) {
        errors.push(`Node ${node.id}: prompt is required`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
