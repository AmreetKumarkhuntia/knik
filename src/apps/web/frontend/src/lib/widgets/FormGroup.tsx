import { useId } from 'react'
import type { FormGroupProps } from '$types'

export default function FormGroup({
  title,
  sub,
  bodyClassName = 'px-[18px] py-1',
  children,
}: FormGroupProps) {
  const id = useId()
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="m-0 text-h3 text-fg-1">
        {title}
      </h2>
      {sub && <p className="mt-0.5 text-body-sm text-fg-3">{sub}</p>}
      <div className={`knik-card mt-3 rounded-[16px] ${bodyClassName}`}>{children}</div>
    </section>
  )
}
