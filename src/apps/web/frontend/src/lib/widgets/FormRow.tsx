import type { FormRowProps } from '$types/widgets'

export default function FormRow({ htmlFor, hintId, label, hint, children, last }: FormRowProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3.5 ${last ? '' : 'border-b border-border-1'}`}
    >
      <div className="min-w-[160px] flex-1">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="block text-body font-medium text-fg-1">
            {label}
          </label>
        ) : (
          <div className="text-body font-medium text-fg-1">{label}</div>
        )}
        {hint && (
          <p id={hintId} className="mt-0.5 text-caption text-fg-4">
            {hint}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}
