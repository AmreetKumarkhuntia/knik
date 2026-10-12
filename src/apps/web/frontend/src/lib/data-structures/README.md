# Data Structures

A small directed graph used to convert between workflow definitions and ReactFlow canvas nodes.

- `Graph<T>`: `addNode`, `getNode`, `getNodes`, `addEdge`, `getEdges`, `hasCycle`, and `toCanvasNodes`.
- `toCanvasNodes({ width, height, direction, nodeSpacingX, nodeSpacingY, nodeType, edgeType })`
  returns ReactFlow `{ nodes, edges }` positioned by `calculateDagLayout` (layered, deterministic).
- Adapters (`adapters/`):
  - `canvasNodesToGraph` converts ReactFlow nodes and edges into a graph.
  - `workflowDefinitionToGraph` and `graphToWorkflowDefinition` convert to and from the workflow contract.
  - `validateWorkflowGraph` checks a graph (cycle, required node config, Start/End warnings).
- Branch conditions live on the source node's `config.conditions` as `{ [targetId]: condition }`.

Import from `$lib/data-structures`.
