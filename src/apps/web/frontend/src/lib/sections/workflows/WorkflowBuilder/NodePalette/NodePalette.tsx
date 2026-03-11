import NodeTypeItem from './NodeTypeItem'
import type { NodePaletteProps } from '$types/workflow-components'
import { getAllNodeTypes } from '$lib/constants/nodes'

export default function NodePalette({ onDragStart }: NodePaletteProps) {
  const nodeTypes = getAllNodeTypes()

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
              iconColor={node.colors.iconText}
              iconBgColor={node.colors.iconBg}
              hoverBorderColor={node.colors.hoverBorder}
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
