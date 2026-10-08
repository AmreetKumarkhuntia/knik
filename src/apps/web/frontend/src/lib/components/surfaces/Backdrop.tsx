import type { BackdropProps } from '$types/components'

export default function Backdrop({
  visible,
  onClick,
  opacity = 60,
  className = '',
}: BackdropProps) {
  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-30 ${className}`}
      style={{ backgroundColor: `rgba(7, 9, 13, ${opacity / 100})` }}
      onClick={onClick}
    />
  )
}
