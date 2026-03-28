import type { CardProps } from '$types/components'

const variants = {
  default: 'bg-surface/50',
  bordered: 'bg-surface/50 border border-border',
  elevated: 'bg-surface/50 border border-border shadow-2xl',
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

/** Versatile card container with variant and padding options. */
export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
}: CardProps) {
  return (
    <div
      className={`
        ${variants[variant]}
        ${paddings[padding]}
        rounded-xl
        backdrop-blur-3xl
        ${className}
      `}
    >
      {children}
    </div>
  )
}
