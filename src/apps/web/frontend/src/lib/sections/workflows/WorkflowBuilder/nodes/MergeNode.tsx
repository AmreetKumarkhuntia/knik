import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { MergeNodeData } from '$types/workflow-components'

export default memo(function MergeNode({ data }: NodeProps) {
  const nodeData = data as unknown as MergeNodeData
  return (
    <div className="relative">
      <div className="rounded-xl node-glass border border-blue-500/50 p-4 min-w-[180px] shadow-lg">
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-blue-500 !w-3 !h-3 !border-2 !border-background-dark"
        />
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-blue-500 !w-3 !h-3 !border-2 !border-background-dark"
        />
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <span className="material-symbols-outlined text-xl">call_merge</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text">Merge</span>
            <span className="text-[10px] text-textSecondary uppercase">Join Paths</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[10px] text-textSecondary">
            data_object
          </span>
          <p className="text-textSecondary text-xs font-mono">
            {nodeData.merge_strategy || 'concat'}
          </p>
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-blue-500 !w-3 !h-3 !border-2 !border-background-dark"
        />
      </div>
    </div>
  )
})
