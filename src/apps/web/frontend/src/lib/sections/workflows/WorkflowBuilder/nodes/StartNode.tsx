import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { StartNodeData } from '$types/workflow-components'

export default memo(function StartNode({ data }: NodeProps) {
  const nodeData = data as unknown as StartNodeData
  return (
    <div className="relative">
      <div className="flex items-center gap-4 rounded-full node-glass px-6 py-4 neon-border-green">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30">
          <span className="material-symbols-outlined">play_arrow</span>
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-white">{nodeData.label || 'Start Trigger'}</h3>
          <p className="text-[10px] text-green-400 uppercase tracking-tighter">Initial Input</p>
        </div>
        <div className="ml-4 h-3 w-3 rounded-full bg-green-500 border-2 border-background-dark cursor-pointer"></div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-background-dark"
      />
    </div>
  )
})
