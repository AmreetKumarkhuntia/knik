import NodeTypeItem from './NodeTypeItem'
import type { NodePaletteProps } from '$types/workflow-components'
import type { NodeTypeName } from '$types/workflow'

const nodeTypes: Array<{
  type: NodeTypeName | 'StartNode' | 'EndNode'
  icon: string
  label: string
  typeLabel: string
  iconColor?: string
  iconBgColor?: string
  hoverBorderColor?: string
  isGradient?: boolean
}> = [
  {
    type: 'StartNode',
    icon: 'play_circle',
    label: 'Start',
    typeLabel: 'Trigger Point',
    iconColor: 'text-green-500',
    iconBgColor: 'bg-green-500/10',
    hoverBorderColor: 'hover:border-green-500',
  },
  {
    type: 'FunctionExecutionNode',
    icon: 'settings_input_component',
    label: 'Function',
    typeLabel: 'Processing',
    iconColor: 'text-accent-purple',
    iconBgColor: 'bg-accent-purple/10',
    hoverBorderColor: 'hover:border-accent-purple',
  },
  {
    type: 'ConditionalBranchNode',
    icon: 'call_split',
    label: 'Conditional',
    typeLabel: 'Logic Switch',
    iconColor: 'text-orange-500',
    iconBgColor: 'bg-orange-500/10',
    hoverBorderColor: 'hover:border-orange-500',
  },
  {
    type: 'FlowMergeNode',
    icon: 'call_merge',
    label: 'Merge',
    typeLabel: 'Join Paths',
    iconColor: 'text-blue-500',
    iconBgColor: 'bg-blue-500/10',
    hoverBorderColor: 'hover:border-blue-500',
  },
  {
    type: 'AIExecutionNode',
    icon: 'auto_awesome',
    label: 'AI Agent',
    typeLabel: 'Smart Node',
    isGradient: true,
    hoverBorderColor: 'hover:border-accent-teal',
  },
  {
    type: 'EndNode',
    icon: 'stop_circle',
    label: 'End',
    typeLabel: 'Output Result',
    iconColor: 'text-red-500',
    iconBgColor: 'bg-red-500/10',
    hoverBorderColor: 'hover:border-red-500',
  },
]

export default function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <aside className="w-72 border-r border-borderLight bg-surface dark:bg-background-dark flex flex-col gradient-sidebar">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-purple/20 text-accent-purple">
            <span className="material-symbols-outlined">widgets</span>
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-textSecondary">
            Node Types
          </h2>
        </div>

        <div className="space-y-3">
          {nodeTypes.map(node => (
            <NodeTypeItem
              key={node.type}
              icon={node.icon}
              label={node.label}
              typeLabel={node.typeLabel}
              type={node.type}
              onDragStart={onDragStart}
              iconColor={node.iconColor}
              iconBgColor={node.iconBgColor}
              hoverBorderColor={node.hoverBorderColor}
              isGradient={node.isGradient}
            />
          ))}
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-borderLight">
        <div className="flex flex-col gap-3 rounded-xl bg-white/5 dark:bg-white/5 p-4 border border-borderLight">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-textSecondary uppercase">Credits</span>
            <span className="text-[10px] font-bold text-accent-teal">84%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/10">
            <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-accent-purple to-accent-teal"></div>
          </div>
        </div>
      </div>
    </aside>
  )
}
