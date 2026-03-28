import { PlayIcon, PauseIcon, StopIcon } from '$components/icons'
import type { AudioControlsProps } from '$types/sections/audio'

/** Audio playback controls with play/pause and stop buttons. */
export default function AudioControls({
  isPlayingOrLoading,
  isPaused,
  onTogglePause,
  onStop,
}: AudioControlsProps) {
  if (!isPlayingOrLoading) return null

  return (
    <div className="mb-3 flex justify-center gap-2">
      <button
        onClick={onTogglePause}
        className={`${
          isPaused ? 'bg-success hover:bg-success/80' : 'bg-warning hover:bg-warning/80'
        } text-foreground px-6 py-3 rounded-lg font-semibold
                   transition-all duration-200 shadow-xl hover:shadow-2xl active:scale-95
                   flex items-center gap-2`}
      >
        {isPaused ? (
          <>
            <PlayIcon />
            Resume
          </>
        ) : (
          <>
            <PauseIcon />
            Pause
          </>
        )}
      </button>

      <button
        onClick={onStop}
        className="bg-error hover:bg-error/80 text-foreground px-6 py-3 rounded-lg font-semibold
                 transition-all duration-200 shadow-xl hover:shadow-2xl active:scale-95
                 flex items-center gap-2"
      >
        <StopIcon />
        Stop
      </button>
    </div>
  )
}
