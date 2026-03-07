import type { NodeTypeName } from '$types/workflow'
import type { NodePaletteProps } from '$types/workflow-components'

const nodeTypes: Array<{
  type: NodeTypeName | 'StartNode' | 'EndNode'
  icon: string
  label: string
  color: string
}> = [
  { type: 'StartNode', icon: '▶', label: 'Start', color: 'border-green-500/50 bg-green-500/10' },
  { type: 'EndNode', icon: '⏹', label: 'End', color: 'border-red-500/50 bg-red-500/10' },
  {
    type: 'FunctionExecutionNode',
    icon: '⚡',
    label: 'Function',
    color: 'border-blue-500/50 bg-blue-500/10',
  },
  {
    type: 'ConditionalBranchNode',
    icon: '🔀',
    label: 'Conditional',
    color: 'border-yellow-500/50 bg-yellow-500/10',
  },
  {
    type: 'FlowMergeNode',
    icon: '🔗',
    label: 'Merge',
    color: 'border-purple-500/50 bg-purple-500/10',
  },
  {
    type: 'AIExecutionNode',
    icon: '🤖',
    label: 'AI',
    color: 'border-emerald-500/50 bg-emerald-500/10',
  },
]

export default function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4 w-48">
      <h3 className="text-white/80 text-sm font-medium mb-3">Node Types</h3>
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
            <span className="text-white/80 text-sm">{node.label}</span>
          </div>
        ))}
      </div>
      <p className="text-white/40 text-xs mt-4">Drag nodes to canvas</p>
    </div>
  )
}
