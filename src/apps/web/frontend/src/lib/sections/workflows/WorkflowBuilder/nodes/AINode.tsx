import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { AINodeData } from '$types/workflow-components'

export default memo(function AINode({ data }: NodeProps) {
  const nodeData = data as unknown as AINodeData
  return (
    <div className="relative">
      <div className="p-[2px] rounded-2xl gradient-node-border shadow-2xl shadow-accent-purple/20">
        <div className="node-glass rounded-[14px] p-6 flex flex-col items-center gap-3 min-w-[180px]">
          <span className="material-symbols-outlined text-accent-teal text-4xl">psychology</span>
          <div className="text-center">
            <h3 className="text-sm font-bold text-white">{nodeData.label || 'Data Analysis'}</h3>
            <span className="text-[10px] py-0.5 px-2 rounded-full bg-accent-teal/10 text-accent-teal border border-accent-teal/20">
              AI PROCESSING
            </span>
          </div>
          {nodeData.model && (
            <p className="text-textSecondary text-xs text-center">{nodeData.model}</p>
          )}
          <div className="flex justify-between w-full mt-2">
            <div className="h-2 w-2 rounded-full bg-surface border border-borderLight"></div>
            <div className="h-2 w-2 rounded-full bg-surface border border-borderLight"></div>
          </div>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-surface !w-3 !h-3 !border-2 !border-accent-purple"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-surface !w-3 !h-3 !border-2 !border-accent-teal"
      />
    </div>
  )
})
