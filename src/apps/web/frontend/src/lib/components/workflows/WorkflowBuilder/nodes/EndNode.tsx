import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

interface EndNodeData {
  label?: string
}

export default memo(function EndNode({ data }: NodeProps) {
  const nodeData = data as unknown as EndNodeData
  return (
    <div className="bg-red-500/20 border-2 border-red-500 rounded-full p-3 min-w-[80px] shadow-lg text-center">
      <Handle type="target" position={Position.Top} className="!bg-red-400 !w-3 !h-3" />
      <span className="text-white font-medium text-sm">{nodeData.label || 'End'}</span>
    </div>
  )
})
