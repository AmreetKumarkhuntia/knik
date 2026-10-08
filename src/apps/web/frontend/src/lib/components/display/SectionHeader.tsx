import type { SectionHeaderProps } from '$types/components'
import Button from '../buttons/Button'
import Badge from './Badge'
export default function SectionHeader({
  title,
  level = 'page',
  subtitle,
  actions,
  right,
  actionText,
  onActionClick,
  badge,
  className = '',
  ...props
}: SectionHeaderProps) {
  const Heading = level === 'page' ? 'h1' : 'h2'
  return (
    <div {...props} className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div>
        <div className="flex items-center gap-3">
          <Heading
            className={`text-fg-1 font-semibold tracking-tight ${level === 'page' ? 'text-2xl' : 'text-base'}`}
          >
            {title}
          </Heading>
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
