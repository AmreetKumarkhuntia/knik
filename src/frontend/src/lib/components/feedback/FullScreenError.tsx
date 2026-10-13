import Button from '$components/buttons/Button'
import MS from '$components/display/MS'
import type { FullScreenErrorViewProps } from '$types/widgets/chat-shell'

export default function FullScreenError({
  message,
  title = 'Something went wrong',
  onBack,
  onRetry,
  layout,
}: FullScreenErrorViewProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-4 p-6 text-center ${layout === 'screen' ? 'min-h-screen knik-shell-bg' : 'flex-1'}`}
    >
      <span className="flex items-center justify-center w-10 h-10 rounded-[12px] bg-[var(--danger-bg)] text-[var(--danger)]">
        <MS name="error" size={20} />
      </span>
      <h1 className="text-h1 text-fg-1">{title}</h1>
      <p className="text-body-lg text-fg-3 max-w-lg">{message}</p>
      {(onRetry || onBack) && (
        <div className="flex flex-wrap justify-center gap-2">
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              Try again
            </Button>
          )}
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              Go back
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
