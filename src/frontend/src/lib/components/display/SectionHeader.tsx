import type { SectionHeaderProps } from '$types/components'
export default function SectionHeader({
  title,
  level = 'page',
  subtitle,
  actions,
  className = '',
  ...props
}: SectionHeaderProps) {
  return (
    <div {...props} className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {level === 'page' ? (
          <h1 className="text-h1 text-fg-1 tracking-tight">{title}</h1>
        ) : (
          <h2 className="text-h3 text-fg-1">{title}</h2>
        )}
        {subtitle && <p className="mt-1 text-body text-fg-3">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}
