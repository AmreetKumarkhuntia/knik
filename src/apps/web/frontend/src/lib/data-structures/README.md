# Data Structures Library - Graph Data Structure with Canvas Integration

A TypeScript-based graph data structure library with built-in algorithms and automatic canvas visualization using ReactFlow.

## Features

- **Graph Construction**: Create directed/undirected, weighted/unweighted graphs
- **Algorithms**: DFS, BFS, Dijkstra, topological sort, cycle detection
- **Auto Layout**: Force-directed, grid, and circular layouts using d3-force
- **Canvas Integration**: Automatic conversion to ReactFlow nodes/edges

## Installation

The library is already installed with the required dependencies:

- `d3-force` for layout algorithms
- `@xyflow/react` for canvas rendering

## Usage

### Basic Graph Creation

```typescript
import { Graph } from '$lib/data-structures'

const graph = new Graph<string>({ directed: true, weighted: true })

graph.addNode('A', 'node-a', { label: 'Node A', type: 'FunctionExecutionNode' })
graph.addNode('B', 'node-b', { label: 'Node B', type: 'AIExecutionNode' })
graph.addNode('C', 'node-c', { label: 'Node C', type: 'FunctionExecutionNode' })

graph.addEdge('node-a', 'node-b', 10)
graph.addEdge('node-b', 'node-c', 5)
graph.addEdge('node-a', 'node-c', 20)
```

### Running Algorithms

```typescript
const dfsResult = graph.dfs('node-a')
const bfsResult = graph.bfs('node-a')

const path = graph.shortestPath('node-a', 'node-c')
console.log(path)

const hasCycle = graph.hasCycle()
const topSort = graph.topologicalSort()
const isConnected = graph.isConnected()
```

### Canvas Visualization

```typescript
import FlowCanvas from '$lib/components/graph/FlowCanvas'
import { BaseNode, FlowEdge } from '$lib/components/graph'

const nodeTypes = { default: BaseNode }
const edgeTypes = { custom: FlowEdge }

function MyComponent() {
  const graph = new Graph<string>({ directed: true })

  graph.addNode('A', 'a', { label: 'Node A', type: 'FunctionExecutionNode' })
  graph.addNode('B', 'b', { label: 'Node B', type: 'AIExecutionNode' })
  graph.addEdge('a', 'b')

  const { nodes, edges } = graph.toCanvasNodes({
    layout: 'force',
    width: 1200,
    height: 800,
    nodeType: 'default',
    edgeType: 'custom',
    forceStrength: -500,
    linkDistance: 200,
  })

  return (
    <FlowCanvas
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      showMiniMap
      fitView
    />
  )
}
```

## API Reference

### `Graph<T>`

#### Constructor

```typescript
new Graph<T>(options?: GraphOptions)
```

Options:

- `directed?: boolean` - Create directed graph (default: true)
- `weighted?: boolean` - Support weighted edges (default: false)

#### Node Operations

- `addNode(value: T, id?: string, config?: Record<string, unknown>): GraphNode<T>`
- `removeNode(id: string): boolean`
- `getNode(id: string): GraphNode<T> | undefined`
- `hasNode(id: string): boolean`
- `getNodes(): GraphNode<T>[]`

#### Edge Operations

- `addEdge(fromId: string, toId: string, weight?: number): this`
- `removeEdge(fromId: string, toId: string): boolean`
- `hasEdge(fromId: string, toId: string): boolean`
- `getEdges(): Array<{ from: string; to: string; weight?: number }>`

#### Traversal Algorithms

- `dfs(startId: string, callback?: (node) => void): GraphNode<T>[]`
- `bfs(startId: string, callback?: (node) => void): GraphNode<T>[]`

#### Path Finding

- `dijkstra(startId: string): Map<string, { distance: number; path: string[] }>`
- `shortestPath(startId: string, endId: string): { path: string[]; distance: number } | null`

#### Graph Properties

- `hasCycle(): boolean`
- `topologicalSort(): GraphNode<T>[] | null`
- `isConnected(): boolean`

#### Canvas Integration

- `toCanvasNodes(options?: CanvasOptions): { nodes: Node[]; edges: Edge[] }`

Canvas Options:

- `layout?: 'force' | 'grid' | 'circular'` - Layout algorithm (default: 'force')
- `width?: number` - Canvas width (default: 800)
- `height?: number` - Canvas height (default: 600)
- `nodeType?: string` - ReactFlow node type (default: 'default')
- `edgeType?: string` - ReactFlow edge type (default: 'default')
- `forceStrength?: number` - Force layout repulsion (default: -400)
- `linkDistance?: number` - Force layout edge length (default: 150)
- `nodeConfig?: (node) => Record<string, unknown>` - Custom node data transform
- `edgeConfig?: (from, to, weight) => Record<string, unknown>` - Custom edge data transform

## Example

See `examples/GraphExample.tsx` for a complete working example.

## File Structure

```
$lib/data-structures/
├── types.ts              # TypeScript interfaces
├── core/
│   └── GraphNode.ts     # Graph node class
├── structures/
│   └── Graph.ts         # Main graph class
├── layout/
│   └── GraphLayout.ts   # d3-force layout engine
├── adapters/
│   └── graphAdapter.ts  # Canvas conversion
├── examples/
│   └── GraphExample.tsx # Usage example
└── index.ts             # Public API
```
