import { playAudio } from './playback'

let audioQueue: Array<{ audio: string; sampleRate: number }> = []
let isPlayingQueue = false

async function playQueue(): Promise<void> {
  if (isPlayingQueue) return

  isPlayingQueue = true

  while (audioQueue.length > 0) {
    const chunk = audioQueue.shift()
    if (chunk) {
      try {
        await playAudio(chunk.audio, chunk.sampleRate, () => audioQueue.length)
      } catch (err) {
        console.error('[Audio Queue] Failed to play chunk:', err)
      }
    }
  }

  isPlayingQueue = false
}

/** Enqueues a base64 audio chunk for sequential playback. */
export function queueAudio(base64Audio: string, sampleRate: number = 24000): void {
  audioQueue.push({ audio: base64Audio, sampleRate })

  if (!isPlayingQueue) {
    playQueue().catch(err => console.error('[Audio Queue] Error starting playback:', err))
  }
}

/** Removes all pending audio chunks from the queue. */
export function clearAudioQueue(): void {
  audioQueue = []
}

/** Resumes playing the queue if it was stopped with remaining chunks. */
export function resumeQueue(): void {
  if (!isPlayingQueue && audioQueue.length > 0) {
    playQueue().catch(err => console.error('[Audio Queue] Error resuming queue:', err))
  }
}

/** Stops queue playback and clears all pending chunks. */
export function stopQueue(): void {
  isPlayingQueue = false
  clearAudioQueue()
}

/** Plays an array of audio chunks sequentially, awaiting each one. */
export async function playAudioChunks(
  audioChunks: string[],
  sampleRate: number = 24000
): Promise<void> {
  for (const chunk of audioChunks) {
    await playAudio(chunk, sampleRate)
  }
}
