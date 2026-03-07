import { buttonVariants, sizeVariants } from '$lib/constants'
import type { ActionButtonProps } from '$types/components'

export default function ActionButton({
  icon,
  label,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  className = '',
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-lg border font-medium
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${buttonVariants[variant]} ${sizeVariants[size]} ${className}
      `}
    >
      {loading ? (
        <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        icon
      )}
      {label}
    </button>
  )
}
