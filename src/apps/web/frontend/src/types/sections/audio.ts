/** Props for the audio playback controls. */
export interface AudioControlsProps {
  isPlayingOrLoading: boolean
  isPaused: boolean
  onTogglePause: () => void
  onStop: () => void
}
