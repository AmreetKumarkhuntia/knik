import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force'
import type { LayoutOptions, SimNode, SimLink } from '$types/data-structures'

export function calculateForceLayout(
  nodes: Array<{ id: string }>,
  edges: Array<{ source: string; target: string }>,
  options: LayoutOptions
): Map<string, { x: number; y: number }> {
  const simNodes: SimNode[] = nodes.map(n => ({
    id: n.id,
    x: Math.random() * options.width,
    y: Math.random() * options.height,
  }))

  const simLinks: SimLink[] = edges.map(e => ({
    source: e.source,
    target: e.target,
  }))

  const simulation = forceSimulation(simNodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id(d => d.id)
        .distance(options.linkDistance ?? 150)
    )
    .force('charge', forceManyBody().strength(options.strength ?? -400))
    .force('center', forceCenter(options.width / 2, options.height / 2))
    .stop()

  for (let i = 0; i < 300; i++) {
    simulation.tick()
  }

  const positions = new Map<string, { x: number; y: number }>()
  simNodes.forEach(n => {
    positions.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 })
  })

  return positions
}

export function calculateGridLayout(
  nodes: Array<{ id: string }>,
  options: LayoutOptions
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const cols = Math.ceil(Math.sqrt(nodes.length))
  const cellWidth = options.width / cols
  const cellHeight = options.height / cols

  nodes.forEach((node, i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    positions.set(node.id, {
      x: col * cellWidth + cellWidth / 2,
      y: row * cellHeight + cellHeight / 2,
    })
  })

  return positions
}

/**
 * DAG (Directed Acyclic Graph) layered layout — left-to-right flow.
 *
 * Assigns each node a layer equal to its longest path from any root node,
 * then spaces layers evenly along X and nodes within each layer evenly along Y.
 * Produces a clean left-to-right flow that communicates execution order.
 */
export function calculateDagLayout(
  nodes: Array<{ id: string }>,
  edges: Array<{ source: string; target: string }>,
  options: LayoutOptions & { nodeSpacingX?: number; nodeSpacingY?: number }
): Map<string, { x: number; y: number }> {
  const nodeSpacingX = options.nodeSpacingX ?? 220
  const nodeSpacingY = options.nodeSpacingY ?? 120

  const successors = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  for (const n of nodes) {
    successors.set(n.id, [])
    inDegree.set(n.id, 0)
  }

  for (const e of edges) {
    successors.get(e.source)?.push(e.target)
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
  }

  const layer = new Map<string, number>()
  const queue: string[] = []

  for (const n of nodes) {
    if ((inDegree.get(n.id) ?? 0) === 0) {
      queue.push(n.id)
      layer.set(n.id, 0)
    }
  }

  // If no roots found (cycle), fall back: assign all layer 0
  if (queue.length === 0) {
    for (const n of nodes) layer.set(n.id, 0)
  } else {
    let head = 0
    while (head < queue.length) {
      const current = queue[head++]
      const currentLayer = layer.get(current) ?? 0
      for (const next of successors.get(current) ?? []) {
        const nextLayer = currentLayer + 1
        if (!layer.has(next) || (layer.get(next) ?? 0) < nextLayer) {
          layer.set(next, nextLayer)
        }
        queue.push(next)
      }
    }
  }

  const layerGroups = new Map<number, string[]>()
  for (const n of nodes) {
    const l = layer.get(n.id) ?? 0
    if (!layerGroups.has(l)) layerGroups.set(l, [])
    layerGroups.get(l)!.push(n.id)
  }

  const numLayers = Math.max(...layerGroups.keys()) + 1
  const totalWidth = (numLayers - 1) * nodeSpacingX
  const startX = (options.width - totalWidth) / 2

  const positions = new Map<string, { x: number; y: number }>()

  for (const [l, ids] of layerGroups) {
    const x = startX + l * nodeSpacingX
    const totalHeight = (ids.length - 1) * nodeSpacingY
    const startY = (options.height - totalHeight) / 2

    ids.forEach((id, i) => {
      positions.set(id, { x, y: startY + i * nodeSpacingY })
    })
  }

  return positions
}

export function calculateCircularLayout(
  nodes: Array<{ id: string }>,
  options: LayoutOptions
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const centerX = options.width / 2
  const centerY = options.height / 2
  const radius = Math.min(options.width, options.height) / 3

  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length
    positions.set(node.id, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    })
  })

  return positions
}
