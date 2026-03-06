import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { ConditionalNodeDefinition } from '$types/workflow'

interface ConditionalNodeData extends ConditionalNodeDefinition {
  label?: string
}

export default memo(function ConditionalNode({ data }: NodeProps) {
  const nodeData = data as unknown as ConditionalNodeData
  return (
    <div className="bg-gray-800 border-2 border-yellow-500/50 rounded-lg p-3 min-w-[180px] shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-yellow-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔀</span>
        <span className="text-white font-medium text-sm">Conditional</span>
      </div>
      <p className="text-white/60 text-xs truncate font-mono">
        {nodeData.condition || 'No condition'}
      </p>
      <div className="flex justify-between mt-2">
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className="!bg-green-400 !w-3 !h-3"
          style={{ left: '30%' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="!bg-red-400 !w-3 !h-3"
          style={{ left: '70%' }}
        />
      </div>
      <div className="flex justify-between text-xs text-white/40 mt-1 px-2">
        <span>true</span>
        <span>false</span>
      </div>
    </div>
  )
})
