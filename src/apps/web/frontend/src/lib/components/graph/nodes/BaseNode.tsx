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
      className={`!${config.color || defaultColor} !w-2.5 !h-2.5 !border-2 !border-[#0d021f]`}
      style={config.style}
    />
  )
}

function getStatusOverlay(status?: string) {
  switch (status) {
    case 'success':
      return 'ring-1 ring-green-500/40 border-green-500/60'
    case 'failed':
      return 'ring-1 ring-red-500/40 border-red-500/60'
    case 'running':
      return 'animate-pulse border-blue-500/60'
    case 'pending':
      return 'opacity-60'
    default:
      return ''
  }
}

// ── Pill Node (Start / End) ───────────────────────────────────────────────────
function PillNode({ metadata, data }: { metadata: NodeMetadata; data: BaseNodeData }) {
  const { icon, colors, handles, contentRenderer } = metadata
  const isStart = contentRenderer === 'start'
  const isExecution = data.mode === 'execution'
  const neonClass = isExecution ? (colors.neonBorder ?? '') : ''
  const statusOverlay = isExecution ? getStatusOverlay(data.status) : ''

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 rounded-full border ${colors.border} bg-[#171717] ${isExecution ? 'px-3 py-2' : 'px-5 py-3'} ${neonClass} ${statusOverlay}`}
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
          <h3 className="text-xs font-semibold text-slate-100">{data.label || metadata.label}</h3>
          {!isExecution && (
            <p className={`text-[10px] ${colors.iconText} uppercase tracking-wider`}>
              {metadata.typeLabel}
            </p>
          )}
          {isExecution && data.duration !== undefined && (
            <span className="text-[9px] text-slate-400">
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

// ── AI Card Node (clean card with teal top accent strip) ──────────────────────
function AICardNode({ metadata, data }: { metadata: NodeMetadata; data: BaseNodeData }) {
  const { icon, label, typeLabel, colors, handles, contentRenderer } = metadata
  const isExecution = data.mode === 'execution'
  const statusOverlay = isExecution ? getStatusOverlay(data.status) : ''

  return (
    <div className="relative">
      <div
        className={`rounded-xl border ${colors.border} bg-[#171717] overflow-hidden ${isExecution ? 'min-w-[160px]' : 'min-w-[200px]'} shadow-md ${statusOverlay}`}
      >
        {/* Thin teal top accent strip */}
        <div className="h-0.5 w-full bg-[#14b8a6]/60" />

        {/* Header row */}
        <div className={`flex items-center gap-2 px-3 ${isExecution ? 'py-2' : 'pt-3 pb-2'}`}>
          <span
            className={`material-symbols-outlined ${isExecution ? 'text-sm' : 'text-base'} ${colors.iconText}`}
          >
            {icon}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-slate-100 truncate">{data.label || label}</h3>
          </div>
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors.iconBg} ${colors.iconText} border ${colors.border}`}
          >
            {typeLabel}
          </span>
        </div>

        {/* Edit mode: content + port labels */}
        {!isExecution && (
          <div className="px-3 pb-3">
            <NodeContent renderer={contentRenderer} data={data} />
            <div className="flex justify-between mt-2">
              <span className="text-[9px] uppercase tracking-widest text-slate-500">INPUTS</span>
              <span className="text-[9px] uppercase tracking-widest text-slate-500">OUTPUTS</span>
            </div>
          </div>
        )}

        {/* Execution mode: duration only */}
        {isExecution && data.duration !== undefined && (
          <div className="px-3 pb-2 text-[10px] text-slate-400">
            {data.duration < 1000 ? `${data.duration}ms` : `${(data.duration / 1000).toFixed(2)}s`}
          </div>
        )}
      </div>

      {handles.inputs.map((handle, i) => (
        <NodeHandle key={`in-${i}`} config={handle} type="target" defaultColor="bg-[#171717]" />
      ))}
      {handles.outputs.map((handle, i) => (
        <NodeHandle key={`out-${i}`} config={handle} type="source" defaultColor="bg-[#171717]" />
      ))}
    </div>
  )
}

// ── Default Node ──────────────────────────────────────────────────────────────
function DefaultNode({ metadata, data }: { metadata: NodeMetadata; data: BaseNodeData }) {
  const { icon, label, typeLabel, colors, handles, contentRenderer } = metadata
  const isExecution = data.mode === 'execution'
  const statusOverlay = isExecution ? getStatusOverlay(data.status) : ''

  return (
    <div className="relative">
      <div
        className={`rounded-xl border ${colors.border} bg-[#171717] px-3 ${isExecution ? 'py-2' : 'px-4 py-3'} min-w-[160px] ${statusOverlay}`}
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
            <span className="text-xs font-semibold text-slate-100 truncate">
              {data.label || label}
            </span>
            {!isExecution && (
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                {typeLabel}
              </span>
            )}
          </div>
        </div>

        {!isExecution && <NodeContent renderer={contentRenderer} data={data} />}

        {isExecution && data.duration !== undefined && (
          <div className="text-[10px] text-slate-400 mt-1">
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

// ── Dispatcher ────────────────────────────────────────────────────────────────
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
