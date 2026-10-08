import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force'
import type { LayoutOptions, DagLayoutOptions, SimNode, SimLink } from '$types/data-structures'

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

export function calculateDagLayout(
  nodes: Array<{ id: string }>,
  edges: Array<{ source: string; target: string }>,
  options: DagLayoutOptions
): Map<string, { x: number; y: number }> {
  if (nodes.length === 0) return new Map()
  const { nodeSpacingX = 220, nodeSpacingY = 120, direction = 'horizontal' } = options
  const successors = new Map(nodes.map(node => [node.id, new Set<string>()]))
  const inDegree = new Map(nodes.map(node => [node.id, 0]))
  for (const edge of edges) {
    const targets = successors.get(edge.source)
    if (!targets || !inDegree.has(edge.target) || targets.has(edge.target)) continue
    targets.add(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  const layers = new Map<string, number>()
  const queue = nodes.filter(node => inDegree.get(node.id) === 0).map(node => node.id)
  for (const id of queue) layers.set(id, 0)
  const processed = new Set<string>()
  for (let head = 0; head < queue.length; head++) {
    const id = queue[head]
    processed.add(id)
    const nextLayer = (layers.get(id) ?? 0) + 1
    for (const next of successors.get(id) ?? []) {
      layers.set(next, Math.max(layers.get(next) ?? 0, nextLayer))
      const remaining = (inDegree.get(next) ?? 0) - 1
      inDegree.set(next, remaining)
      if (remaining === 0) queue.push(next)
    }
  }

  // Cycle members and nodes blocked behind them share a final, deterministic layer.
  const fallbackLayer = processed.size
    ? Math.max(...Array.from(processed, id => layers.get(id) ?? 0)) + 1
    : 0
  const groups = new Map<number, string[]>()
  for (const node of nodes) {
    const layer = processed.has(node.id) ? (layers.get(node.id) ?? 0) : fallbackLayer
    const group = groups.get(layer) ?? []
    group.push(node.id)
    groups.set(layer, group)
  }

  const lastLayer = Math.max(...groups.keys())
  const positions = new Map<string, { x: number; y: number }>()
  for (const [layer, ids] of groups) {
    ids.forEach((id, index) => {
      positions.set(
        id,
        direction === 'vertical'
          ? {
              x: (options.width - (ids.length - 1) * nodeSpacingX) / 2 + index * nodeSpacingX,
              y: (options.height - lastLayer * nodeSpacingY) / 2 + layer * nodeSpacingY,
            }
          : {
              x: (options.width - lastLayer * nodeSpacingX) / 2 + layer * nodeSpacingX,
              y: (options.height - (ids.length - 1) * nodeSpacingY) / 2 + index * nodeSpacingY,
            }
      )
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
