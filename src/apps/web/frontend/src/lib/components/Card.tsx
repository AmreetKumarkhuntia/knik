import type { CardProps } from '$types/components'

const variants = {
  default: 'knik-card',
  bordered: 'knik-card',
  elevated: 'knik-card shadow-knik-2',
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
        ${className}
      `}
    >
      {children}
    </div>
  )
}
