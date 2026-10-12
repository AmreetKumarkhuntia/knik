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
      ? 'text-aurora-300 border-[color-mix(in_srgb,var(--aurora-300)_30%,transparent)] bg-[color-mix(in_srgb,var(--aurora-300)_10%,transparent)]'
      : 'border-border-2 bg-surface-2 text-fg-2'
  const interactiveClasses = onRemove
    ? 'cursor-pointer hover:brightness-110 active:scale-95 transition-all'
    : ''

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill font-mono text-mono-sm border ${variantClasses} ${interactiveClasses} ${className}`}
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
