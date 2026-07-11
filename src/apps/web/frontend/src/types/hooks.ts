/** A keyboard shortcut binding with modifier keys and handler. */
export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  handler: () => void
}

/** Options for the microphone recorder hook. */
export interface UseMicRecorderOptions {
  /** Capture a specific input device; omitted = the browser/OS default via the permission prompt. */
  deviceId?: string
  /** Auto-stop after this many seconds (default 60). */
  maxDuration?: number
  /** Called with the recorded audio blob when recording stops. */
  onComplete?: (blob: Blob) => void
}

/** State and controls returned by useMicRecorder. */
export interface UseMicRecorderResult {
  recording: boolean
  seconds: number
  start: () => void
  stop: () => void
  error: string | null
}
