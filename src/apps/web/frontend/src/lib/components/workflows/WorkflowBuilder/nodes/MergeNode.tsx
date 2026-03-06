import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { MergeNodeData } from '$types/workflow-components'

export default memo(function MergeNode({ data }: NodeProps) {
  const nodeData = data as unknown as MergeNodeData
  return (
    <div className="bg-gray-800 border-2 border-purple-500/50 rounded-lg p-3 min-w-[180px] shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-purple-400 !w-3 !h-3" />
      <Handle type="target" position={Position.Left} className="!bg-purple-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔗</span>
        <span className="text-white font-medium text-sm">Merge</span>
      </div>
      <p className="text-white/60 text-xs">{nodeData.merge_strategy || 'concat'}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400 !w-3 !h-3" />
    </div>
  )
})
