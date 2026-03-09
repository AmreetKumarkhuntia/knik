import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { ConditionalNodeData } from '$types/workflow-components'

export default memo(function ConditionalNode({ data }: NodeProps) {
  const nodeData = data as unknown as ConditionalNodeData
  return (
    <div className="relative">
      <div className="rounded-xl node-glass border border-orange-500/50 p-4 min-w-[180px] shadow-lg">
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-orange-500 !w-3 !h-3 !border-2 !border-background-dark"
        />
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
            <span className="material-symbols-outlined text-xl">call_split</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text">Conditional</span>
            <span className="text-[10px] text-textSecondary uppercase">Logic Switch</span>
          </div>
        </div>
        <p className="text-textSecondary text-xs truncate font-mono bg-white/5 rounded px-2 py-1">
          {nodeData.condition || 'No condition'}
        </p>
        <div className="flex justify-between mt-3 gap-2">
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-green-500 font-medium uppercase">True</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="true"
              className="!bg-green-500 !w-3 !h-3 !border-2 !border-background-dark"
              style={{ left: '20%' }}
            />
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-red-500 font-medium uppercase">False</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="false"
              className="!bg-red-500 !w-3 !h-3 !border-2 !border-background-dark"
              style={{ left: '80%' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})
