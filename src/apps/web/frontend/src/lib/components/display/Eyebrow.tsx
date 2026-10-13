import type { EyebrowProps } from '$types'

export default function Eyebrow({ children }: EyebrowProps) {
  return (
    <div className="px-2 pb-2.5 text-micro font-semibold uppercase tracking-[.09em] text-fg-4">
      {children}
    </div>
  )
}
