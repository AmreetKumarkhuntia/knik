import type { NodeTypeName } from '$types/workflow'
import type { NodePaletteProps } from '$types/workflow-components'

const nodeTypes: Array<{
  type: NodeTypeName
  icon: string
  label: string
  color: string
}> = [
  { type: 'StartNode', icon: '▶', label: 'Start', color: 'border-primary bg-primary/10' },
  { type: 'EndNode', icon: '⏹', label: 'End', color: 'border-error bg-error/10' },
  {
    type: 'FunctionExecutionNode',
    icon: '⚡',
    label: 'Function',
    color: 'border-primary bg-primary/10',
  },
  {
    type: 'ConditionalBranchNode',
    icon: '🔀',
    label: 'Conditional',
    color: 'border-warning bg-warning/10',
  },
  {
    type: 'FlowMergeNode',
    icon: '🔗',
    label: 'Merge',
    color: 'border-primary bg-primary/10',
  },
  {
    type: 'AIExecutionNode',
    icon: '🤖',
    label: 'AI',
    color: 'border-success bg-success/10',
  },
]

export default function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <div className="bg-surfaceGlass backdrop-blur-xl border border-borderLight rounded-xl p-4 w-48">
      <h3 className="text-textSecondary text-sm font-medium mb-3">Node Types</h3>
      <div className="space-y-2">
        {nodeTypes.map(node => (
          <div
            key={node.type}
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('application/reactflow', node.type)
              e.dataTransfer.effectAllowed = 'move'
              onDragStart(node.type)
            }}
            className={`
              flex items-center gap-2 p-2 rounded-lg border cursor-grab
              hover:scale-105 transition-transform ${node.color}
            `}
          >
            <span className="text-lg">{node.icon}</span>
            <span className="text-textSecondary text-sm">{node.label}</span>
          </div>
        ))}
      </div>
      <p className="text-textSecondary text-xs mt-4">Drag nodes to canvas</p>
    </div>
  )
}
