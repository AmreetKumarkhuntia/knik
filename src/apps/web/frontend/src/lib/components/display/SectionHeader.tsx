import type { SectionHeaderProps } from '$types/components'
export default function SectionHeader({
  title,
  level = 'page',
  subtitle,
  actions,
  className = '',
  ...props
}: SectionHeaderProps) {
  const Heading = level === 'page' ? 'h1' : 'h2'
  return (
    <div {...props} className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div>
        <Heading className={`text-fg-1 tracking-tight ${level === 'page' ? 'text-h1' : 'text-h4'}`}>
          {title}
        </Heading>
        {subtitle && <p className="text-body text-fg-4 mt-1">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}
