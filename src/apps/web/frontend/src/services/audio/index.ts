import { setMediaSessionUpdater } from './playback'
import { updateMediaSession } from './mediaSession'

// Initialize media session updater to avoid circular dependency
setMediaSessionUpdater(updateMediaSession)

export * from './playback'
export * from './queue'
export * from './mediaSession'
