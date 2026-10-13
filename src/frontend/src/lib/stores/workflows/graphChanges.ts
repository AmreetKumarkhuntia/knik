import type { Connection, Edge, EdgeChange, Node, NodeChange } from '@xyflow/react'

/*
 * Ports of @xyflow/react 12's applyNodeChanges, applyEdgeChanges and addEdge. StoresProvider loads
 * this store eagerly, so a runtime import of @xyflow/react here would pull the whole library and its
 * d3 dependencies into the entry chunk even though the canvas itself is lazy.
 */
type ElementChange = NodeChange | EdgeChange

// Mutates the copy made by applyChanges, as xyflow does, so each element is copied only once.
function applyChange(change: ElementChange, element: Partial<Node>) {
  switch (change.type) {
    case 'select':
      element.selected = change.selected
      break
    case 'position':
      if (change.position !== undefined) element.position = change.position
      if (change.dragging !== undefined) element.dragging = change.dragging
      break
    case 'dimensions':
      if (change.dimensions !== undefined) {
        element.measured = { ...change.dimensions }
        if (change.setAttributes === true || change.setAttributes === 'width')
          element.width = change.dimensions.width
        if (change.setAttributes === true || change.setAttributes === 'height')
          element.height = change.dimensions.height
      }
      if (typeof change.resizing === 'boolean') element.resizing = change.resizing
      break
  }
}

function applyChanges<T extends Node | Edge>(changes: ElementChange[], elements: T[]): T[] {
  const changesById = new Map<string, ElementChange[]>()
  const additions: Extract<ElementChange, { type: 'add' }>[] = []
  for (const change of changes) {
    if (change.type === 'add') additions.push(change)
    // A remove or replace supersedes any other change queued for the same element.
    else if (change.type === 'remove' || change.type === 'replace')
      changesById.set(change.id, [change])
    else {
      const queued = changesById.get(change.id)
      if (queued) queued.push(change)
      else changesById.set(change.id, [change])
    }
  }
  const updated: T[] = []
  for (const element of elements) {
    const queued = changesById.get(element.id)
    if (!queued) {
      updated.push(element)
      continue
    }
    const [first] = queued
    if (first.type === 'remove') continue
    if (first.type === 'replace') {
      updated.push({ ...first.item } as T)
      continue
    }
    const copy = { ...element }
    for (const change of queued) applyChange(change, copy as Partial<Node>)
    updated.push(copy)
  }
  // Additions run last so an insertion index refers to the already updated list.
  for (const change of additions) {
    if (change.index !== undefined) updated.splice(change.index, 0, { ...change.item } as T)
    else updated.push({ ...change.item } as T)
  }
  return updated
}

export const applyNodeChanges = (changes: NodeChange[], nodes: Node[]) =>
  applyChanges(changes, nodes)

export const applyEdgeChanges = (changes: EdgeChange[], edges: Edge[]) =>
  applyChanges(changes, edges)

const connectionExists = (edge: Edge, edges: Edge[]) =>
  edges.some(
    other =>
      other.source === edge.source &&
      other.target === edge.target &&
      (other.sourceHandle === edge.sourceHandle || (!other.sourceHandle && !edge.sourceHandle)) &&
      (other.targetHandle === edge.targetHandle || (!other.targetHandle && !edge.targetHandle))
  )

export function addEdge(params: Edge | (Connection & Partial<Edge>), edges: Edge[]): Edge[] {
  if (!params.source || !params.target) return edges
  const edge: Edge = {
    ...params,
    id:
      params.id ??
      `xy-edge__${params.source}${params.sourceHandle || ''}-${params.target}${params.targetHandle || ''}`,
  }
  if (connectionExists(edge, edges)) return edges
  if (edge.sourceHandle === null) delete edge.sourceHandle
  if (edge.targetHandle === null) delete edge.targetHandle
  return edges.concat(edge)
}
