import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { getNodeMetadata } from '$lib/constants/nodes'
import { GRAPH_NODE_SIZE } from '$lib/constants/graph'
import { formatDuration } from '$utils/format'
import type { HandleConfig } from '$types/node-registry'
import type { BaseNodeData } from '$types/graph'
import MS from '../../display/MS'
import { NodeContent } from './NodeContent'

const POSITION_MAP = {
  top: Position.Top,
  bottom: Position.Bottom,
  left: Position.Left,
  right: Position.Right,
}

const VERTICAL_POSITION_MAP = {
  top: Position.Left,
  bottom: Position.Right,
  left: Position.Top,
  right: Position.Bottom,
}

const STATUS_ICONS = {
  success: 'check_circle',
  failed: 'error',
  running: 'progress_activity',
  pending: 'schedule',
}

function NodeHandle({
  config,
  type,
  vertical,
  showLabel,
}: {
  config: HandleConfig
  type: 'source' | 'target'
  vertical: boolean
  showLabel: boolean
}) {
  const position = vertical ? VERTICAL_POSITION_MAP[config.position] : POSITION_MAP[config.position]
  const style = { ...config.style }
  if (vertical && style.top) {
    style.left = style.top
    delete style.top
  }
  return (
    <Handle
      type={type}
      position={position}
      id={config.id}
      className="graph-node__handle"
      aria-label={
        config.label ? `${config.label} ${type === 'source' ? 'output' : 'input'}` : undefined
      }
      style={{ ...style, backgroundColor: config.color ?? 'var(--fg-3)' }}
    >
      {showLabel && config.label && (
        <span
          className={`graph-node__port-label graph-node__port-label--${position}`}
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      )}
    </Handle>
  )
}

export default memo(function BaseNode({ data, type, selected }: NodeProps) {
  const nodeData = data as BaseNodeData
  const vertical = nodeData.direction === 'vertical'
  const metadata = getNodeMetadata(type as string)
  if (!metadata) return null

  const isExecution = nodeData.mode === 'execution'
  const terminal = metadata.shape === 'pill'
  const dimensions = terminal ? GRAPH_NODE_SIZE.terminal : GRAPH_NODE_SIZE.process
  const label = nodeData.label || metadata.label
  const duration = nodeData.duration
  const status = nodeData.status
  const classes = [
    'graph-node',
    terminal ? 'graph-node--terminal' : 'graph-node--process',
    // Opacity-only entrance: xyflow reads handle positions with getBoundingClientRect on mount, so
    // the design's scale pop would anchor edges to the shrunken node.
    isExecution ? 'graph-node--execution' : 'graph-node--editable knik-enter-fade',
    selected && 'graph-node--selected',
    isExecution && status && status !== 'pending' && `graph-node--${status}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      style={{ width: dimensions.width, height: isExecution ? dimensions.height : undefined }}
    >
      <div className="graph-node__header">
        <span className={`graph-node__icon ${metadata.colors.iconBg} ${metadata.colors.iconText}`}>
          <MS name={metadata.icon} size={17} />
        </span>
        <div className="graph-node__heading">
          <h3 className="graph-node__title" title={label}>
            {label}
          </h3>
          {(!terminal || !isExecution) && <p className="graph-node__type">{metadata.typeLabel}</p>}
        </div>
      </div>

      {!isExecution && !terminal && (
        <div className="graph-node__content">
          <NodeContent renderer={metadata.contentRenderer} data={nodeData} />
        </div>
      )}

      {isExecution && !terminal && (status || duration !== undefined) && (
        <div className="graph-node__execution">
          {status && (
            <span className={`graph-node__status graph-node__status--${status}`}>
              <MS name={STATUS_ICONS[status]} size={15} />
              <span>{status}</span>
            </span>
          )}
          {duration !== undefined && (
            <span className="graph-node__duration">{formatDuration(duration)}</span>
          )}
        </div>
      )}

      {metadata.handles.inputs.map((handle, i) => (
        <NodeHandle
          key={`in-${handle.id ?? i}`}
          config={handle}
          type="target"
          vertical={vertical}
          showLabel={false}
        />
      ))}
      {metadata.handles.outputs.map((handle, i) => (
        <NodeHandle
          key={`out-${handle.id ?? i}`}
          config={handle}
          type="source"
          vertical={vertical}
          showLabel={metadata.contentRenderer === 'conditional'}
        />
      ))}
    </div>
  )
})
