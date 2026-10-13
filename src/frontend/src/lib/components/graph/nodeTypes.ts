import type { NodeTypes } from '@xyflow/react'
import { NODE_REGISTRY } from '$lib/constants/nodes'
import BaseNode from './nodes/BaseNode'

/** Every registered node type renders through BaseNode. */
export const nodeTypes: NodeTypes = Object.fromEntries(
  Object.keys(NODE_REGISTRY).map(type => [type, BaseNode])
)
