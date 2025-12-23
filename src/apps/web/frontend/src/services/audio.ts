/**
 * Audio playback utilities
 */

let currentAudio: HTMLAudioElement | null = null
let currentResolve: (() => void) | null = null

// Audio queue for streaming playback
let audioQueue: Array<{ audio: string; sampleRate: number }> = []
let isPlayingQueue = false

/**
 * Add audio chunk to queue and start playing if not already playing
 */
export function queueAudio(base64Audio: string, sampleRate: number = 24000): void {
  console.log('[Audio Queue] Adding chunk to queue, current queue size:', audioQueue.length)
  audioQueue.push({ audio: base64Audio, sampleRate })
  
  // Start playing if not already playing
  if (!isPlayingQueue) {
    playQueue().catch(err => console.error('[Audio Queue] Error starting playback:', err))
  }
}

/**
 * Play audio queue sequentially
 */
async function playQueue(): Promise<void> {
  if (isPlayingQueue) return
  
  isPlayingQueue = true
  console.log('[Audio Queue] Starting queue playback')
  
  while (audioQueue.length > 0) {
    const chunk = audioQueue.shift()
    if (chunk) {
      console.log(`[Audio Queue] Playing chunk, remaining: ${audioQueue.length}`)
      try {
        await playAudio(chunk.audio, chunk.sampleRate)
      } catch (err) {
        console.error('[Audio Queue] Failed to play chunk:', err)
      }
    }
  }
  
  isPlayingQueue = false
  console.log('[Audio Queue] Queue playback complete')
}

/**
 * Clear audio queue
 */
export function clearAudioQueue(): void {
  console.log('[Audio Queue] Clearing queue')
  audioQueue = []
}

/**
 * Play multiple base64 encoded audio chunks sequentially
 */
export async function playAudioChunks(audioChunks: string[], sampleRate: number = 24000): Promise<void> {
  console.log(`[Audio] Playing ${audioChunks.length} chunks sequentially`)
  for (let i = 0; i < audioChunks.length; i++) {
    console.log(`[Audio] Playing chunk ${i + 1}/${audioChunks.length}`)
    await playAudio(audioChunks[i], sampleRate)
  }
  console.log('[Audio] All chunks played')
}

/**
 * Play base64 encoded audio
 */
export function playAudio(base64Audio: string, _sampleRate: number = 24000): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log('[Audio] Starting playback, data length:', base64Audio.length)
      
      // Only stop if we're not in a queue (currentAudio should be null after previous ended)
      if (currentAudio && !currentAudio.paused) {
        console.log('[Audio] Stopping previous audio')
        currentAudio.pause()
        currentAudio = null
      }
      
      // Store resolve function so stopAudio can call it
      currentResolve = resolve
      
      // Decode base64 to binary
      const binaryString = atob(base64Audio)
      console.log('[Audio] Decoded binary length:', binaryString.length)
      
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // Create blob and audio element
      const blob = new Blob([bytes], { type: 'audio/wav' })
      console.log('[Audio] Created blob, size:', blob.size, 'type:', blob.type)
      
      const audioUrl = URL.createObjectURL(blob)
      console.log('[Audio] Created object URL:', audioUrl)
      
      const audio = new Audio(audioUrl)
      currentAudio = audio
      
      // Play audio
      audio.onended = () => {
        console.log('[Audio] Playback ended')
        URL.revokeObjectURL(audioUrl)
        currentAudio = null
        currentResolve = null
        resolve()
      }
      
      audio.onerror = (err) => {
        console.error('[Audio] Playback error:', err)
        URL.revokeObjectURL(audioUrl)
        currentAudio = null
        currentResolve = null
        reject(new Error('Audio playback failed'))
      }
      
      // Set volume to ensure it's audible
      audio.volume = 1.0
      
      audio.play()
        .then(() => console.log('[Audio] Play started successfully'))
        .catch((err) => {
          console.error('[Audio] Play failed:', err)
          reject(err)
        })
    } catch (error) {
      console.error('[Audio] Exception:', error)
      reject(error)
    }
  })
}

/**
 * Stop currently playing audio
 */
export function stopAudio() {
  console.log('[Audio] Stopping audio')
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  
  // Resolve the pending promise if any
  if (currentResolve) {
    currentResolve()
    currentResolve = null
  }
  
  // Stop queue playback
  isPlayingQueue = false
}

/**
 * Check if audio is currently playing
 */
export function isAudioPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused
}

/**
 * Stop all currently playing audio (legacy)
 */
export function stopAllAudio() {
  stopAudio()
  const audioElements = document.getElementsByTagName('audio')
  for (let i = 0; i < audioElements.length; i++) {
    audioElements[i].pause()
    audioElements[i].currentTime = 0
  }
}
