import type { CardProps } from '$types/components'

const variants = {
  default: 'bg-black/10',
  bordered: 'bg-black/10 border border-white/20',
  elevated: 'bg-black/10 border border-white/20 shadow-2xl',
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

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
