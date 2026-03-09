import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { FunctionNodeData } from '$types/workflow-components'

export default memo(function FunctionNode({ data }: NodeProps) {
  const nodeData = data as unknown as FunctionNodeData
  return (
    <div className="relative">
      <div className="rounded-xl node-glass border border-accent-purple/50 p-4 min-w-[180px] shadow-lg">
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-accent-purple !w-3 !h-3 !border-2 !border-background-dark"
        />
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-purple/10 text-accent-purple">
            <span className="material-symbols-outlined text-xl">settings_input_component</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text">Function</span>
            <span className="text-[10px] text-textSecondary uppercase">Processing</span>
          </div>
        </div>
        <p className="text-textSecondary text-xs truncate font-mono">
          {nodeData.function_name || 'Unnamed'}
        </p>
        {nodeData.params && Object.keys(nodeData.params).length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[10px] text-textSecondary">
              data_object
            </span>
            <span className="text-textSecondary/60 text-[10px]">
              {Object.keys(nodeData.params).length} parameters
            </span>
          </div>
        )}
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-accent-purple !w-3 !h-3 !border-2 !border-background-dark"
        />
      </div>
    </div>
  )
})
