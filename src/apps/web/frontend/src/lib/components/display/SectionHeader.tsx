import type { SectionHeaderProps } from '$types/components'
import Button from '../buttons/Button'
import Badge from './Badge'
export default function SectionHeader({
  title,
  subtitle,
  actions,
  right,
  actionText,
  onActionClick,
  badge,
  className = '',
  ...props
}: SectionHeaderProps) {
  return (
    <div {...props} className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-fg-1 text-xl font-bold">{title}</h2>
          {badge && <Badge>{badge}</Badge>}
        </div>
        {subtitle && <p className="text-sm text-fg-4 mt-1">{subtitle}</p>}
      </div>
      {actions ??
        right ??
        (actionText && onActionClick && (
          <Button variant="ghost" size="sm" onClick={onActionClick}>
            {actionText}
          </Button>
        ))}
    </div>
  )
}
