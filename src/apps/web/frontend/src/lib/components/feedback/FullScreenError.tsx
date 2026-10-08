import Button from '$components/buttons/Button'
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
      className={`flex flex-col items-center justify-center gap-4 p-6 ${layout === 'screen' ? 'min-h-screen' : 'flex-1'}`}
    >
      <h1 className="text-2xl font-semibold text-fg-1">{title}</h1>
      <p className="text-error text-lg max-w-lg text-center">{message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
      {onBack && <Button onClick={onBack}>Go back</Button>}
    </div>
  )
}
