import { forwardRef, useId } from 'react'
import type { TextareaProps } from '$types/components/forms'
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className = '', ...props },
  ref
) {
  const errorId = useId()
  return (
    <>
      <textarea
        ref={ref}
        {...props}
        aria-invalid={!!error || props['aria-invalid']}
        aria-describedby={
          [props['aria-describedby'], error ? errorId : ''].filter(Boolean).join(' ') || undefined
        }
        className={`knik-input w-full ${className}`}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </>
  )
})
export default Textarea
