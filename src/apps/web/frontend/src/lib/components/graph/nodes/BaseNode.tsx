import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { getNodeMetadata } from '$lib/constants/nodes'
import type { HandleConfig, NodeMetadata } from '$types/node-registry'
import type { BaseNodeData } from '$types/graph'
import { NodeContent } from './NodeContent'

export type { BaseNodeData }

const POSITION_MAP = {
  top: Position.Top,
  bottom: Position.Bottom,
  left: Position.Left,
  right: Position.Right,
}

function NodeHandle({
  config,
  type,
  defaultColor,
}: {
  config: HandleConfig
  type: 'source' | 'target'
  defaultColor: string
}) {
  return (
    <Handle
      type={type}
      position={POSITION_MAP[config.position]}
      id={config.id}
      className={`!${config.color || defaultColor} !w-3 !h-3 !border-2 !border-background-dark`}
      style={config.style}
    />
  )
}

function getStatusOverlay(status?: string) {
  switch (status) {
    case 'success':
      return 'ring-2 ring-green-500/30 border-green-500'
    case 'failed':
      return 'ring-2 ring-red-500/30 border-red-500'
    case 'running':
      return 'animate-pulse border-blue-500'
    case 'pending':
      return `opacity-60`
    default:
      return ''
  }
}

function PillNode({ metadata, data }: { metadata: NodeMetadata; data: BaseNodeData }) {
  const { icon, colors, handles, contentRenderer } = metadata
  const isStart = contentRenderer === 'start'
  const statusOverlay = data.mode === 'execution' ? getStatusOverlay(data.status) : ''

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-4 rounded-full node-glass px-6 py-4 ${colors.neonBorder || ''} ${statusOverlay}`}
      >
        {!isStart && (
          <div
            className={`mr-4 h-3 w-3 rounded-full ${colors.iconBg.replace('/10', '')} border-2 border-background-dark cursor-pointer`}
          />
        )}
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.iconBg.replace('/10', '')} text-white shadow-lg shadow-${colors.primary}-500/30`}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className={`flex flex-col ${!isStart ? 'text-right' : ''}`}>
          <h3 className="text-sm font-bold text-white">{data.label || metadata.label}</h3>
          <p
            className={`text-[10px] ${colors.iconText.replace('text-', 'text-')} uppercase tracking-tighter`}
          >
            {metadata.typeLabel}
          </p>
          {data.mode === 'execution' && data.duration !== undefined && (
            <span className="text-[9px] text-gray-400 mt-0.5">
              {data.duration < 1000
                ? `${data.duration}ms`
                : `${(data.duration / 1000).toFixed(2)}s`}
            </span>
          )}
        </div>
        {isStart && (
          <div
            className={`ml-4 h-3 w-3 rounded-full ${colors.iconBg.replace('/10', '')} border-2 border-background-dark cursor-pointer`}
          />
        )}
      </div>

      {handles.inputs.map((handle, i) => (
        <NodeHandle key={`in-${i}`} config={handle} type="target" defaultColor={colors.iconText} />
      ))}
      {handles.outputs.map((handle, i) => (
        <NodeHandle key={`out-${i}`} config={handle} type="source" defaultColor={colors.iconText} />
      ))}
    </div>
  )
}

function GradientNode({ metadata, data }: { metadata: NodeMetadata; data: BaseNodeData }) {
  const { icon, label, typeLabel, colors, handles, contentRenderer } = metadata
  const statusOverlay = data.mode === 'execution' ? getStatusOverlay(data.status) : ''

  return (
    <div className="relative">
      <div
        className={`p-[2px] rounded-2xl gradient-node-border shadow-2xl shadow-accent-purple/20 ${statusOverlay}`}
      >
        <div className="node-glass rounded-[14px] p-6 flex flex-col items-center gap-3 min-w-[180px]">
          <span className={`material-symbols-outlined ${colors.iconText} text-4xl`}>{icon}</span>
          <div className="text-center">
            <h3 className="text-sm font-bold text-white">{data.label || label}</h3>
            <span
              className={`text-[10px] py-0.5 px-2 rounded-full ${colors.iconBg} ${colors.iconText} border ${colors.border}`}
            >
              {typeLabel.toUpperCase()}
            </span>
          </div>
          <NodeContent renderer={contentRenderer} data={data} />
          {data.mode === 'execution' && data.duration !== undefined && (
            <div className="text-xs text-gray-400 mt-1">
              {data.duration < 1000
                ? `${data.duration}ms`
                : `${(data.duration / 1000).toFixed(2)}s`}
            </div>
          )}
        </div>
      </div>

      {handles.inputs.map((handle, i) => (
        <NodeHandle key={`in-${i}`} config={handle} type="target" defaultColor="bg-surface" />
      ))}
      {handles.outputs.map((handle, i) => (
        <NodeHandle key={`out-${i}`} config={handle} type="source" defaultColor="bg-surface" />
      ))}
    </div>
  )
}

function DefaultNode({ metadata, data }: { metadata: NodeMetadata; data: BaseNodeData }) {
  const { icon, label, typeLabel, colors, handles, contentRenderer } = metadata
  const statusOverlay = data.mode === 'execution' ? getStatusOverlay(data.status) : ''

  return (
    <div className="relative">
      <div
        className={`rounded-xl node-glass border ${colors.border} p-4 min-w-[180px] shadow-lg ${statusOverlay}`}
      >
        {handles.inputs.map((handle, i) => (
          <NodeHandle
            key={`in-${i}`}
            config={handle}
            type="target"
            defaultColor={colors.iconText}
          />
        ))}

        <div className="flex items-center gap-3 mb-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText}`}
          >
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text">{label}</span>
            <span className="text-[10px] text-textSecondary uppercase">{typeLabel}</span>
          </div>
        </div>

        <NodeContent renderer={contentRenderer} data={data} />

        {data.mode === 'execution' && data.duration !== undefined && (
          <div className="text-xs text-gray-400 mt-2">
            {data.duration < 1000 ? `${data.duration}ms` : `${(data.duration / 1000).toFixed(2)}s`}
          </div>
        )}

        {handles.outputs.map((handle, i) => (
          <NodeHandle
            key={`out-${i}`}
            config={handle}
            type="source"
            defaultColor={colors.iconText}
          />
        ))}
      </div>
    </div>
  )
}

export default memo(function BaseNode({ data, type }: NodeProps) {
  const metadata = getNodeMetadata(type as string)
  if (!metadata) return null

  const nodeData = data as BaseNodeData

  if (metadata.shape === 'pill') {
    return <PillNode metadata={metadata} data={nodeData} />
  }

  if (metadata.isGradient) {
    return <GradientNode metadata={metadata} data={nodeData} />
  }

  return <DefaultNode metadata={metadata} data={nodeData} />
})
