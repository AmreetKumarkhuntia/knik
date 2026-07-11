import { buttonVariants, sizeVariants } from '$lib/constants'
import type { ActionButtonProps } from '$types/components'

/** Action button with variant and size support. */
export default function ActionButton({
  icon,
  label,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  title,
}: ActionButtonProps) {
  const isIconOnly = !label && icon

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={title || (isIconOnly ? label : undefined)}
      className={`
        knik-btn knik-focus
        ${buttonVariants[variant]} ${sizeVariants[size]} ${className}
      `}
    >
      {loading ? (
        <span className="knik-spinner knik-spinner--sm" />
      ) : (
        icon && <span className={isIconOnly ? '' : ''}>{icon}</span>
      )}
      {label && <span>{label}</span>}
    </button>
  )
}
