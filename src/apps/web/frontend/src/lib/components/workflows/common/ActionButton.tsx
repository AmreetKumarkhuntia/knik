import type { ReactNode } from 'react'

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

const variantConfig = {
  primary: 'bg-white/10 hover:bg-white/20 text-white border-white/30',
  secondary: 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 border-gray-500/30',
  danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30',
  ghost: 'bg-transparent hover:bg-white/10 text-white/70 border-transparent',
}

const sizeConfig = {
  sm: 'px-2 py-1 text-xs gap-1',
  md: 'px-3 py-1.5 text-sm gap-1.5',
  lg: 'px-4 py-2 text-base gap-2',
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
        ${variantConfig[variant]} ${sizeConfig[size]} ${className}
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
