import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { getNodeMetadata } from '$lib/constants/nodes'
import { darkThemeColors } from '$lib/constants/themes'
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
      className={`!${config.color || defaultColor} !w-2.5 !h-2.5 !border-2`}
      style={{ ...config.style, borderColor: darkThemeColors.nodeHandleBorder }}
    />
  )
}

function getStatusOverlay(status?: string) {
  switch (status) {
    case 'success':
      return 'ring-1 ring-success/40 border-success/60'
    case 'failed':
      return 'ring-1 ring-error/40 border-error/60'
    case 'running':
      return 'animate-pulse border-info/60'
    case 'pending':
      return 'opacity-60'
    default:
      return ''
  }
}

function PillNode({ metadata, data }: { metadata: NodeMetadata; data: BaseNodeData }) {
  const { icon, colors, handles, contentRenderer } = metadata
  const isStart = contentRenderer === 'start'
  const isExecution = data.mode === 'execution'
  const neonClass = isExecution ? (colors.neonBorder ?? '') : ''
  const statusOverlay = isExecution ? getStatusOverlay(data.status) : ''

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 rounded-full border ${colors.border} bg-surfaceRaised ${isExecution ? 'px-3 py-2' : 'px-5 py-3'} ${neonClass} ${statusOverlay}`}
      >
        {!isStart && (
          <div className={`h-1.5 w-1.5 rounded-full ${colors.iconBg.replace('/10', '/60')}`} />
        )}
        <div
          className={`flex ${isExecution ? 'h-6 w-6' : 'h-8 w-8'} items-center justify-center rounded-full ${colors.iconBg} ${colors.iconText}`}
        >
          <span className={`material-symbols-outlined ${isExecution ? 'text-sm' : 'text-base'}`}>
            {icon}
          </span>
        </div>
        <div className={`flex flex-col ${!isStart ? 'text-right' : ''}`}>
          <h3 className="text-xs font-semibold text-foreground">{data.label || metadata.label}</h3>
          {!isExecution && (
            <p className={`text-[10px] ${colors.iconText} uppercase tracking-wider`}>
              {metadata.typeLabel}
            </p>
          )}
          {isExecution && data.duration !== undefined && (
            <span className="text-[9px] text-secondary">
              {data.duration < 1000
                ? `${data.duration}ms`
                : `${(data.duration / 1000).toFixed(2)}s`}
            </span>
          )}
        </div>
        {isStart && (
          <div className={`h-1.5 w-1.5 rounded-full ${colors.iconBg.replace('/10', '/60')}`} />
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

function AICardNode({ metadata, data }: { metadata: NodeMetadata; data: BaseNodeData }) {
  const { icon, label, typeLabel, colors, handles, contentRenderer } = metadata
  const isExecution = data.mode === 'execution'
  const statusOverlay = isExecution ? getStatusOverlay(data.status) : ''

  return (
    <div className="relative">
      <div
        className={`rounded-xl border ${colors.border} bg-surfaceRaised overflow-hidden ${isExecution ? 'min-w-[160px]' : 'min-w-[200px]'} shadow-md ${statusOverlay}`}
      >
        <div className="h-0.5 w-full bg-primary/60" />

        <div className={`flex items-center gap-2 px-3 ${isExecution ? 'py-2' : 'pt-3 pb-2'}`}>
          <span
            className={`material-symbols-outlined ${isExecution ? 'text-sm' : 'text-base'} ${colors.iconText}`}
          >
            {icon}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-foreground truncate">
              {data.label || label}
            </h3>
          </div>
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors.iconBg} ${colors.iconText} border ${colors.border}`}
          >
            {typeLabel}
          </span>
        </div>

        {!isExecution && (
          <div className="px-3 pb-3">
            <NodeContent renderer={contentRenderer} data={data} />
            <div className="flex justify-between mt-2">
              <span className="text-[9px] uppercase tracking-widest text-muted">INPUTS</span>
              <span className="text-[9px] uppercase tracking-widest text-muted">OUTPUTS</span>
            </div>
          </div>
        )}

        {isExecution && data.duration !== undefined && (
          <div className="px-3 pb-2 text-[10px] text-secondary">
            {data.duration < 1000 ? `${data.duration}ms` : `${(data.duration / 1000).toFixed(2)}s`}
          </div>
        )}
      </div>

      {handles.inputs.map((handle, i) => (
        <NodeHandle key={`in-${i}`} config={handle} type="target" defaultColor="bg-surfaceRaised" />
      ))}
      {handles.outputs.map((handle, i) => (
        <NodeHandle
          key={`out-${i}`}
          config={handle}
          type="source"
          defaultColor="bg-surfaceRaised"
        />
      ))}
    </div>
  )
}

function DefaultNode({ metadata, data }: { metadata: NodeMetadata; data: BaseNodeData }) {
  const { icon, label, typeLabel, colors, handles, contentRenderer } = metadata
  const isExecution = data.mode === 'execution'
  const statusOverlay = isExecution ? getStatusOverlay(data.status) : ''

  return (
    <div className="relative">
      <div
        className={`rounded-xl border ${colors.border} bg-surfaceRaised px-3 ${isExecution ? 'py-2' : 'px-4 py-3'} min-w-[160px] ${statusOverlay}`}
      >
        {handles.inputs.map((handle, i) => (
          <NodeHandle
            key={`in-${i}`}
            config={handle}
            type="target"
            defaultColor={colors.iconText}
          />
        ))}

        <div className={`flex items-center gap-2 ${isExecution ? '' : 'mb-2'}`}>
          <div
            className={`flex ${isExecution ? 'h-6 w-6' : 'h-8 w-8'} items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText} flex-shrink-0`}
          >
            <span className={`material-symbols-outlined ${isExecution ? 'text-sm' : 'text-base'}`}>
              {icon}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-foreground truncate">
              {data.label || label}
            </span>
            {!isExecution && (
              <span className="text-[10px] text-secondary uppercase tracking-wide">
                {typeLabel}
              </span>
            )}
          </div>
        </div>

        {!isExecution && <NodeContent renderer={contentRenderer} data={data} />}

        {isExecution && data.duration !== undefined && (
          <div className="text-[10px] text-secondary mt-1">
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

  if (metadata.contentRenderer === 'ai') {
    return <AICardNode metadata={metadata} data={nodeData} />
  }

  return <DefaultNode metadata={metadata} data={nodeData} />
})
