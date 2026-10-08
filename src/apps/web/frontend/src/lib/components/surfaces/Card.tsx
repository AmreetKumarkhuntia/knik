import type { CardProps } from '$types/components'

const variants = {
  default: 'knik-card',
  glass: 'knik-card--glass',
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
  ...props
}: CardProps) {
  return (
    <div
      {...props}
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
