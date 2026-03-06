import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

interface StartNodeData {
  label?: string
}

export default memo(function StartNode({ data }: NodeProps) {
  const nodeData = data as unknown as StartNodeData
  return (
    <div className="bg-green-500/20 border-2 border-green-500 rounded-full p-3 min-w-[80px] shadow-lg text-center">
      <span className="text-white font-medium text-sm">{nodeData.label || 'Start'}</span>
      <Handle type="source" position={Position.Bottom} className="!bg-green-400 !w-3 !h-3" />
    </div>
  )
})
