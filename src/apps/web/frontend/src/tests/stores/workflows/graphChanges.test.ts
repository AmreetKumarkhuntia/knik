import * as xyflow from '@xyflow/react'
import type { Edge, EdgeChange, Node, NodeChange } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import { addEdge, applyEdgeChanges, applyNodeChanges } from '$lib/stores/workflows/graphChanges'

const storeSources = import.meta.glob<string>('../../../lib/stores/**/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const nodes = (): Node[] => [
  { id: 'start', type: 'StartNode', position: { x: 0, y: 0 }, data: {} },
  { id: 'work', type: 'AIExecutionNode', position: { x: 200, y: 0 }, data: { model: 'm' } },
  { id: 'end', type: 'EndNode', position: { x: 400, y: 0 }, data: {} },
]
const edges = (): Edge[] => [
  { id: 'a', source: 'start', target: 'work' },
  { id: 'b', source: 'work', target: 'end', sourceHandle: 'out' },
]

describe('workflow graph changes', () => {
  it.each<[string, NodeChange[]]>([
    [
      'position and drag',
      [{ id: 'work', type: 'position', position: { x: 5, y: 6 }, dragging: true }],
    ],
    [
      'measured dimensions',
      [
        { id: 'start', type: 'dimensions', dimensions: { width: 120, height: 40 } },
        {
          id: 'end',
          type: 'dimensions',
          dimensions: { width: 90, height: 30 },
          setAttributes: true,
          resizing: false,
        },
      ],
    ],
    ['selection', [{ id: 'end', type: 'select', selected: true }]],
    [
      'remove superseding other changes',
      [
        { id: 'work', type: 'select', selected: true },
        { id: 'work', type: 'remove' },
      ],
    ],
    [
      'replace and indexed add',
      [
        { id: 'end', type: 'replace', item: { id: 'end', position: { x: 1, y: 1 }, data: {} } },
        { type: 'add', item: { id: 'new', position: { x: 2, y: 2 }, data: {} }, index: 1 },
        { type: 'add', item: { id: 'last', position: { x: 3, y: 3 }, data: {} } },
      ],
    ],
  ])('applies %s node changes exactly as xyflow does', (_label, changes) => {
    const current = nodes()
    expect(applyNodeChanges(changes, current)).toEqual(xyflow.applyNodeChanges(changes, nodes()))
    expect(applyNodeChanges([], current)[0]).toBe(current[0])
  })

  it('applies edge changes exactly as xyflow does', () => {
    const changes: EdgeChange[] = [
      { id: 'a', type: 'remove' },
      { id: 'b', type: 'select', selected: true },
      { type: 'add', item: { id: 'c', source: 'start', target: 'end' } },
    ]
    expect(applyEdgeChanges(changes, edges())).toEqual(xyflow.applyEdgeChanges(changes, edges()))
  })

  it.each([
    { source: 'start', target: 'end', sourceHandle: null, targetHandle: null, type: 'custom' },
    { source: 'start', target: 'end', sourceHandle: 'yes', targetHandle: null },
    { source: 'work', target: 'end', sourceHandle: 'out', targetHandle: null },
    { source: '', target: 'end', sourceHandle: null, targetHandle: null },
    { id: 'given', source: 'end', target: 'start', sourceHandle: null, targetHandle: null },
  ])('adds edge %o exactly as xyflow does', connection => {
    expect(addEdge(connection, edges())).toEqual(xyflow.addEdge(connection, edges()))
  })

  // StoresProvider is eager, so any runtime xyflow import in a store lands in the entry chunk.
  it('keeps @xyflow runtime imports out of the stores', () => {
    expect(Object.keys(storeSources).length).toBeGreaterThan(20)
    const runtimeImports = Object.entries(storeSources)
      .filter(([, code]) => /^import\s+(?!type\b)[^;]*from\s+['"]@xyflow\//m.test(code))
      .map(([file]) => file)
    expect(runtimeImports).toEqual([])
  })
})
