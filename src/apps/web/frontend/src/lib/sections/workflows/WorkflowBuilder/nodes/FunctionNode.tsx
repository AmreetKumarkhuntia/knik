import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { FunctionNodeData } from '$types/workflow-components'

export default memo(function FunctionNode({ data }: NodeProps) {
  const nodeData = data as unknown as FunctionNodeData
  return (
    <div className="bg-gray-800 border-2 border-blue-500/50 rounded-lg p-3 min-w-[180px] shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">⚡</span>
        <span className="text-white font-medium text-sm">Function</span>
      </div>
      <p className="text-white/60 text-xs truncate">{nodeData.function_name || 'Unnamed'}</p>
      {nodeData.params && Object.keys(nodeData.params).length > 0 && (
        <p className="text-white/40 text-xs mt-1">{Object.keys(nodeData.params).length} params</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-3 !h-3" />
    </div>
  )
})
