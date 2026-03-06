import type { ReactNode } from 'react'
import { buttonVariants, sizeVariants } from '$lib/constants'

interface ActionButtonProps {
  icon?: ReactNode
  label: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

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
