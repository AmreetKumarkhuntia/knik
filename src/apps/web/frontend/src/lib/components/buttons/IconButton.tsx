import type { IconButtonProps } from '$types/components'

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
}

/** Square button displaying only an icon, built on the knik-btn primitive. */
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
        knik-btn knik-btn--${variant} knik-focus
        p-0
        ${sizes[size]}
        ${className}
      `}
    >
      {icon}
    </button>
  )
}
