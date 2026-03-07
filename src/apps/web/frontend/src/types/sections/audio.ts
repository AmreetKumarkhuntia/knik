export interface AudioControlsProps {
  isPlayingOrLoading: boolean
  isPaused: boolean
  onTogglePause: () => void
  onStop: () => void
}
