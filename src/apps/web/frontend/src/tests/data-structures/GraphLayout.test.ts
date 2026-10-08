import { describe, expect, it } from 'vitest'
import { calculateDagLayout } from '$lib/data-structures/layout/GraphLayout'
import { Graph } from '$lib/data-structures/structures/Graph'

const nodes = (...ids: string[]) => ids.map(id => ({ id }))
const edges = (...pairs: Array<[string, string]>) =>
  pairs.map(([source, target]) => ({ source, target }))
const size = { width: 900, height: 600 }

describe('directed graph layout', () => {
  it('preserves horizontal default spacing and centers a linear graph', () => {
    const result = calculateDagLayout(
      nodes('start', 'work', 'end'),
      edges(['start', 'work'], ['work', 'end']),
      size
    )
    expect(Object.fromEntries(result)).toEqual({
      start: { x: 230, y: 300 },
      work: { x: 450, y: 300 },
      end: { x: 670, y: 300 },
    })
  })

  it('supports top-to-bottom layers with explicit spacing', () => {
    const result = calculateDagLayout(
      nodes('start', 'work', 'end'),
      edges(['start', 'work'], ['work', 'end']),
      { ...size, direction: 'vertical', nodeSpacingX: 304, nodeSpacingY: 176 }
    )
    expect(Object.fromEntries(result)).toEqual({
      start: { x: 450, y: 124 },
      work: { x: 450, y: 300 },
      end: { x: 450, y: 476 },
    })
  })

  it.each(['horizontal', 'vertical'] as const)(
    'places a %s join after its longest incoming path',
    direction => {
      const result = calculateDagLayout(
        nodes('start', 'short', 'long', 'extra', 'join', 'end'),
        edges(
          ['start', 'short'],
          ['start', 'long'],
          ['long', 'extra'],
          ['short', 'join'],
          ['extra', 'join'],
          ['join', 'end']
        ),
        { ...size, direction, nodeSpacingX: 304, nodeSpacingY: 176 }
      )
      const forward = direction === 'horizontal' ? 'x' : 'y'
      const across = direction === 'horizontal' ? 'y' : 'x'
      const layerSpacing = direction === 'horizontal' ? 304 : 176
      expect(result.get('short')![forward]).toBe(result.get('long')![forward])
      expect(result.get('join')![forward] - result.get('extra')![forward]).toBe(layerSpacing)
      expect(result.get('end')![forward] - result.get('join')![forward]).toBe(layerSpacing)
      expect(result.get('short')![across] + result.get('long')![across]).toBe(
        direction === 'horizontal' ? size.height : size.width
      )
    }
  )

  it('keeps disconnected roots and isolated nodes in deterministic sibling order', () => {
    const result = calculateDagLayout(
      nodes('first', 'second', 'isolated', 'child'),
      edges(['second', 'child']),
      size
    )
    expect(result.get('first')).toEqual({ x: 340, y: 180 })
    expect(result.get('second')).toEqual({ x: 340, y: 300 })
    expect(result.get('isolated')).toEqual({ x: 340, y: 420 })
    expect(result.get('child')).toEqual({ x: 560, y: 300 })
  })

  it('terminates for rootless cycles and uses one deterministic fallback layer', () => {
    const result = calculateDagLayout(
      nodes('one', 'two'),
      edges(['one', 'two'], ['two', 'one']),
      size
    )
    expect(Object.fromEntries(result)).toEqual({ one: { x: 450, y: 240 }, two: { x: 450, y: 360 } })
  })

  it('terminates for cycles reachable from a root and lays out every node once', () => {
    const graphNodes = nodes('root', 'one', 'two', 'tail')
    const graphEdges = edges(['root', 'one'], ['one', 'two'], ['two', 'one'], ['two', 'tail'])
    const result = calculateDagLayout(graphNodes, graphEdges, size)
    expect(Object.fromEntries(result)).toEqual({
      root: { x: 340, y: 300 },
      one: { x: 560, y: 180 },
      two: { x: 560, y: 300 },
      tail: { x: 560, y: 420 },
    })
    expect(calculateDagLayout(graphNodes, graphEdges, size)).toEqual(result)
    expect(
      new Set(Array.from(result.values(), position => `${position.x}:${position.y}`)).size
    ).toBe(graphNodes.length)
  })

  it('ignores duplicate and dangling edges without blocking valid nodes', () => {
    const graphNodes = nodes('root', 'end')
    const result = calculateDagLayout(
      graphNodes,
      edges(['root', 'end'], ['root', 'end'], ['missing', 'end'], ['end', 'absent']),
      size
    )
    expect(result).toEqual(calculateDagLayout(graphNodes, edges(['root', 'end']), size))
    expect(calculateDagLayout([], [], size)).toEqual(new Map())
  })

  it('passes directional spacing through the canvas adapter without changing graph records', () => {
    const graph = new Graph({ directed: true })
    graph.addNode({ label: 'Start' }, 'start')
    graph.addNode({ label: 'End' }, 'end')
    graph.addEdge('start', 'end')
    const initial = graph.toCanvasNodes({ layout: 'dag', ...size })
    const vertical = graph.toCanvasNodes({
      layout: 'dag',
      ...size,
      direction: 'vertical',
      nodeSpacingX: 304,
      nodeSpacingY: 176,
    })
    expect(vertical.nodes.map(node => node.position)).toEqual([
      { x: 450, y: 212 },
      { x: 450, y: 388 },
    ])
    expect(vertical.edges).toEqual(initial.edges)
    expect(graph.toCanvasNodes({ layout: 'dag', ...size })).toEqual(initial)
  })
})
