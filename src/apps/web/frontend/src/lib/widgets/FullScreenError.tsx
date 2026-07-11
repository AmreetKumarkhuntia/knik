import type { FullScreenErrorProps } from '$types'

/** Centered error message with an optional Go Back button. */
export default function FullScreenError({ message, onBack, layout }: FullScreenErrorProps) {
  const cls =
    layout === 'screen'
      ? 'flex flex-col items-center justify-center h-screen gap-4'
      : 'flex-1 flex items-center justify-center'
  return (
    <div className={cls}>
      <p className="text-error text-lg">{message}</p>
      {onBack && (
        <button
          onClick={onBack}
          className="px-4 py-2 bg-primary text-foreground rounded hover:bg-primary/80"
        >
          Go Back
        </button>
      )}
    </div>
  )
}
