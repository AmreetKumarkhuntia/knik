import { useId } from 'react'
import type { FormGroupProps } from '$types'

export default function FormGroup({ title, sub, children }: FormGroupProps) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="mb-8 last:mb-0">
      <div className="mb-2 border-b border-[var(--border-1)] pb-3">
        <h2 id={id} className="m-0 text-base font-semibold text-fg-1">
          {title}
        </h2>
        {sub && <p className="mt-1 text-sm text-fg-3">{sub}</p>}
      </div>
      {children}
    </section>
  )
}
