import { PlayIcon, PauseIcon, StopIcon } from './index'

interface AudioControlsProps {
  isPlayingOrLoading: boolean
  isPaused: boolean
  onTogglePause: () => void
  onStop: () => void
}

export default function AudioControls({
  isPlayingOrLoading,
  isPaused,
  onTogglePause,
  onStop,
}: AudioControlsProps) {
  if (!isPlayingOrLoading) return null

  return (
    <div className="mb-3 flex justify-center gap-2">
      {/* Pause/Resume button */}
      <button
        onClick={onTogglePause}
        className={`${
          isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
        } text-white px-6 py-3 rounded-lg font-semibold
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

      {/* Stop button */}
      <button
        onClick={onStop}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold
                 transition-all duration-200 shadow-xl hover:shadow-2xl active:scale-95
                 flex items-center gap-2"
      >
        <StopIcon />
        Stop
      </button>
    </div>
  )
}
