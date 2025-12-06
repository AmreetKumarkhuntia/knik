/**
 * Audio playback utilities
 */

let currentAudio: HTMLAudioElement | null = null
let currentResolve: (() => void) | null = null

/**
 * Play base64 encoded audio
 */
export function playAudio(base64Audio: string, _sampleRate: number = 24000): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Stop any currently playing audio
      stopAudio()
      
      // Store resolve function so stopAudio can call it
      currentResolve = resolve
      
      // Decode base64 to binary
      const binaryString = atob(base64Audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // Create blob and audio element
      const blob = new Blob([bytes], { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)
      currentAudio = audio
      
      // Play audio
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        currentAudio = null
        currentResolve = null
        resolve()
      }
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl)
        currentAudio = null
        currentResolve = null
        reject(new Error('Audio playback failed'))
      }
      
      audio.play().catch(reject)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Stop currently playing audio
 */
export function stopAudio() {
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
