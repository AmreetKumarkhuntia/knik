import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { ConditionalNodeData } from '$types/workflow-components'

export default memo(function ConditionalNode({ data }: NodeProps) {
  const nodeData = data as unknown as ConditionalNodeData
  return (
    <div className="bg-surface border-2 border-warning/50 rounded-lg p-3 min-w-[180px] shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-warning !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔀</span>
        <span className="text-text font-medium text-sm">Conditional</span>
      </div>
      <p className="text-textSecondary text-xs truncate font-mono">
        {nodeData.condition || 'No condition'}
      </p>
      <div className="flex justify-between mt-2">
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className="!bg-success !w-3 !h-3"
          style={{ left: '30%' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="!bg-error !w-3 !h-3"
          style={{ left: '70%' }}
        />
      </div>
      <div className="flex justify-between text-xs text-textSecondary/60 mt-1 px-2">
        <span>true</span>
        <span>false</span>
      </div>
    </div>
  )
})
