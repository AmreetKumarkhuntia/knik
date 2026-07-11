import type { FormGroupProps } from '$types'
import SurfaceCard from './SurfaceCard'

/** Titled settings group: a padded surface card with a header block. */
export default function FormGroup({ title, sub, children }: FormGroupProps) {
  return (
    <SurfaceCard padded style={{ marginBottom: 18 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-1)', margin: 0 }}>{title}</h3>
        {sub && <div style={{ fontSize: 12.5, color: 'var(--fg-4)', marginTop: 3 }}>{sub}</div>}
      </div>
      {children}
    </SurfaceCard>
  )
}
