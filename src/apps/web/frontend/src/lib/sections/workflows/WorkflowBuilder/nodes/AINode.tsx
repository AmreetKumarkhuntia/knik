import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { AINodeData } from '$types/workflow-components'

export default memo(function AINode({ data }: NodeProps) {
  const nodeData = data as unknown as AINodeData
  return (
    <div className="bg-surface border-2 border-success/50 rounded-lg p-3 min-w-[180px] shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-success !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🤖</span>
        <span className="text-text font-medium text-sm">AI</span>
      </div>
      <p className="text-textSecondary text-xs truncate">{nodeData.model || 'gemini-1.5-flash'}</p>
      {nodeData.prompt && (
        <p className="text-textSecondary/60 text-xs mt-1 truncate">
          {nodeData.prompt.substring(0, 30)}...
        </p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-success !w-3 !h-3" />
    </div>
  )
})
