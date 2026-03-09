import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { EndNodeData } from '$types/workflow-components'

export default memo(function EndNode({ data }: NodeProps) {
  const nodeData = data as unknown as EndNodeData
  return (
    <div className="relative">
      <div className="flex items-center gap-4 rounded-full node-glass px-6 py-4 neon-border-red">
        <div className="mr-4 h-3 w-3 rounded-full bg-red-500 border-2 border-background-dark cursor-pointer"></div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30">
          <span className="material-symbols-outlined">check</span>
        </div>
        <div className="flex flex-col text-right">
          <h3 className="text-sm font-bold text-white">{nodeData.label || 'Workflow End'}</h3>
          <p className="text-[10px] text-red-400 uppercase tracking-tighter">Output Delivery</p>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-red-500 !w-3 !h-3 !border-2 !border-background-dark"
      />
    </div>
  )
})
