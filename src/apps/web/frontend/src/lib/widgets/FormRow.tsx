import type { FormRowProps } from '$types/widgets'

export default function FormRow({ htmlFor, hintId, label, hint, children, last }: FormRowProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4"
      style={{ borderBottom: last ? 'none' : '1px solid var(--border-1)' }}
    >
      <div className="min-w-[160px] flex-1">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-label text-fg-1">
            {label}
          </label>
        ) : (
          <div className="text-label text-fg-1">{label}</div>
        )}
        {hint && (
          <p id={hintId} className="text-body-sm text-fg-3 mt-1">
            {hint}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}
