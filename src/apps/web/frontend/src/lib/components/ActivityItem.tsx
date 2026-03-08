import type { ActivityItemProps } from '$types/components'

export default function ActivityItem({ type, title, description, time, icon }: ActivityItemProps) {
  const iconMap = {
    success: {
      icon: icon || 'check_circle',
      bg: 'bg-teal-500/10',
      text: 'text-teal-400',
    },
    error: {
      icon: icon || 'error',
      bg: 'bg-rose-500/10',
      text: 'text-rose-500',
    },
    update: {
      icon: icon || 'update',
      bg: 'bg-primary/20',
      text: 'text-primary',
    },
    info: {
      icon: icon || 'info',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
    },
  }

  const config = iconMap[type]

  return (
    <div className="glass border border-white/10 rounded-xl p-4 flex gap-4 hover:bg-white/5 transition-colors">
      <div
        className={`size-10 rounded-full ${config.bg} flex items-center justify-center ${config.text} shrink-0`}
      >
        <span className="material-symbols-outlined text-lg">{config.icon}</span>
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-100 leading-tight">{title}</p>
        {description && <p className="text-xs text-slate-500 leading-tight">{description}</p>}
      </div>
      <span className="text-xs text-slate-500 shrink-0 self-start">{time}</span>
    </div>
  )
}
