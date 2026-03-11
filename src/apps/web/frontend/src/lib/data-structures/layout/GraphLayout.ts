import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import type { LayoutOptions } from '../types'

interface SimNode extends SimulationNodeDatum {
  id: string
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string
  target: string
}

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
