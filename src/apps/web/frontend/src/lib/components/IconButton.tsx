import type { IconButtonProps } from '$types/components'

const variants = {
  ghost: 'text-white/60 hover:text-white hover:bg-white/10',
  secondary: 'text-white/70 hover:text-white bg-gray-500/20 hover:bg-gray-500/30',
  primary: 'text-white bg-white/10 hover:bg-white/20',
  danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
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
