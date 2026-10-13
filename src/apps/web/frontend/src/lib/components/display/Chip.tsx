import type { ChipProps } from '$types'

export default function Chip({
  label,
  variant = 'default',
  onRemove,
  className = '',
  ...props
}: ChipProps) {
  const variantClasses =
    variant === 'tag'
      ? 'bg-[var(--acc-soft)] text-[var(--acc-text)] border border-[var(--acc-border)]'
      : 'bg-panel-3 text-fg-2'
  const interactiveClasses = onRemove
    ? 'cursor-pointer hover:brightness-110 active:scale-95 transition-all'
    : ''

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-[9px] py-[3px] font-mono text-micro leading-none ${variantClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {label}
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          onClick={e => {
            e.stopPropagation()
            onRemove()
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }
          }}
          className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-micro bg-[color-mix(in_srgb,currentColor_10%,transparent)] hover:bg-[color-mix(in_srgb,currentColor_20%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_50%,transparent)]"
          aria-label={typeof label === 'string' ? `Remove ${label}` : 'Remove'}
        >
          ×
        </span>
      )}
    </span>
  )
}
