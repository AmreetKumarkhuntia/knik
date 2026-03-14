import type { IconButtonProps } from '$types/components'

const variants = {
  ghost: 'text-foreground/60 hover:text-foreground hover:bg-surface',
  secondary: 'text-foreground/70 hover:text-foreground bg-foreground/10 hover:bg-foreground/15',
  primary: 'text-foreground bg-surfaceRaised hover:bg-border',
  danger: 'text-error hover:text-error/80 hover:bg-error/10',
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
}

export default function IconButton({
  icon,
  onClick,
  variant = 'ghost',
  size = 'md',
  ariaLabel,
  disabled = false,
  className = '',
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        ${sizes[size]}
        rounded-lg
        flex
        items-center
        justify-center
        transition-all
        duration-200
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
    >
      {icon}
    </button>
  )
}
