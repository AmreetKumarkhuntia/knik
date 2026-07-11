import type { BackdropProps } from '$types/components'

const blurClasses = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
}

/** Full-screen overlay backdrop with configurable blur and opacity. */
export default function Backdrop({
  visible,
  onClick,
  blur = 'md',
  opacity = 60,
  className = '',
}: BackdropProps) {
  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-30 ${blurClasses[blur]} ${className}`}
      style={{ backgroundColor: `rgba(7, 9, 13, ${opacity / 100})` }}
      onClick={onClick}
    />
  )
}
