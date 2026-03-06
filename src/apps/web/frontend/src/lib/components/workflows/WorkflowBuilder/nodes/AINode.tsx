import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { AINodeDefinition } from '$types/workflow'

interface AINodeData extends AINodeDefinition {
  label?: string
}

export default memo(function AINode({ data }: NodeProps) {
  const nodeData = data as unknown as AINodeData
  return (
    <div className="bg-gray-800 border-2 border-emerald-500/50 rounded-lg p-3 min-w-[180px] shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-emerald-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🤖</span>
        <span className="text-white font-medium text-sm">AI</span>
      </div>
      <p className="text-white/60 text-xs truncate">{nodeData.model || 'gemini-1.5-flash'}</p>
      {nodeData.prompt && (
        <p className="text-white/40 text-xs mt-1 truncate">{nodeData.prompt.substring(0, 30)}...</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-400 !w-3 !h-3" />
    </div>
  )
})
