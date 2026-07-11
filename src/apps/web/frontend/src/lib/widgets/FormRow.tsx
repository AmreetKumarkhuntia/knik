import type { FormRowProps } from '$types'

/** Settings row: label + optional hint on the left, control on the right. */
export default function FormRow({ label, hint, children, last }: FormRowProps) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: 16,
        padding: '13px 0',
        borderBottom: last ? 'none' : '1px solid var(--border-1)',
      }}
    >
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13.5, fontWeight: 550, color: 'var(--fg-1)' }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}
