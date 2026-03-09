import type { NodeTypeName } from '$types/workflow'

interface NodeTypeItemProps {
  icon: string
  label: string
  typeLabel: string
  type: NodeTypeName | 'StartNode' | 'EndNode'
  onDragStart: (type: NodeTypeName | 'StartNode' | 'EndNode') => void
  iconColor?: string
  iconBgColor?: string
  hoverBorderColor?: string
  isGradient?: boolean
}

export default function NodeTypeItem({
  icon,
  label,
  typeLabel,
  type,
  onDragStart,
  iconColor = 'text-accent-teal',
  iconBgColor = 'bg-accent-teal/10',
  hoverBorderColor = 'hover:border-accent-teal',
  isGradient = false,
}: NodeTypeItemProps) {
  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', type)
    event.dataTransfer.effectAllowed = 'move'
    onDragStart(type)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`
        group flex items-center gap-3 rounded-xl p-3 
        bg-white/5 dark:bg-white/5 border border-borderLight
        ${hoverBorderColor} transition-all cursor-grab active:cursor-grabbing
      `}
    >
      <div
        className={`
          flex h-10 w-10 items-center justify-center rounded-lg
          ${isGradient ? 'bg-gradient-to-br from-accent-purple to-accent-teal text-white shadow-lg shadow-accent-purple/20' : `${iconBgColor} ${iconColor}`}
        `}
      >
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <div className="flex flex-col">
        <span className={`text-sm font-semibold ${isGradient ? 'gradient-text' : 'text-text'}`}>
          {label}
        </span>
        <span className="text-[10px] text-textSecondary uppercase">{typeLabel}</span>
      </div>
    </div>
  )
}
