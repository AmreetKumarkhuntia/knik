import React from 'react'

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: React.ReactNode
  variant?: 'default' | 'tag' | 'voice' | 'lang' | 'team' | 'input' | 'kbd'
  icon?: React.ReactNode
  onRemove?: () => void
  className?: string
}

export default function Chip({
  label,
  variant = 'default',
  icon,
  onRemove,
  className = '',
  ...props
}: ChipProps) {
  // Base classes mapped from preview styles
  let variantClasses = 'border-border-2 bg-surface-2 text-fg-2'

  switch (variant) {
    case 'tag':
      variantClasses = 'text-aurora-300 border-aurora-300/30 bg-aurora-300/10'
      break
    case 'voice':
      variantClasses = 'text-teal-300 border-teal-300/30 bg-teal-300/10'
      break
    case 'lang':
      variantClasses = 'border-border-2 bg-surface-2 text-fg-2'
      break
    case 'team':
      variantClasses = 'text-violet-400 border-violet-400/30 bg-violet-400/10'
      break
    case 'input':
      variantClasses = 'text-fg-1 border-dashed border-border-3 bg-transparent'
      break
    case 'kbd':
      variantClasses = 'bg-base text-fg-3 border-border-2'
      break
    default:
      break
  }

  // Handle clickable chips gracefully
  const isInteractive = !!onRemove || variant === 'input'
  const interactiveClasses = isInteractive
    ? 'cursor-pointer hover:brightness-110 active:scale-95 transition-all'
    : ''

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill font-mono text-xs border ${variantClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex items-center">{icon}</span>}
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
          className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[9px] bg-current/10 hover:bg-current/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          aria-label="Remove"
        >
          ×
        </span>
      )}
    </span>
  )
}
