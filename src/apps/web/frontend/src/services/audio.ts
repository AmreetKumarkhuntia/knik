/**
 * Audio playback utilities
 */

/**
 * Play base64 encoded audio
 */
export function playAudio(base64Audio: string, _sampleRate: number = 24000): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
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
      
      // Play audio
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        resolve()
      }
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl)
        reject(new Error('Audio playback failed'))
      }
      
      audio.play().catch(reject)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Stop all currently playing audio
 */
export function stopAllAudio() {
  const audioElements = document.getElementsByTagName('audio')
  for (let i = 0; i < audioElements.length; i++) {
    audioElements[i].pause()
    audioElements[i].currentTime = 0
  }
}
