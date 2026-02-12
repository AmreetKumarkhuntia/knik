/**
 * Audio queue management for streaming playback
 */

import { playAudio } from './playback'

let audioQueue: Array<{ audio: string; sampleRate: number }> = []
let isPlayingQueue = false

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

export function queueAudio(base64Audio: string, sampleRate: number = 24000): void {
  console.log('[Audio Queue] Adding chunk to queue, current queue size:', audioQueue.length)
  audioQueue.push({ audio: base64Audio, sampleRate })
  
  if (!isPlayingQueue) {
    playQueue().catch(err => console.error('[Audio Queue] Error starting playback:', err))
  }
}

export function clearAudioQueue(): void {
  console.log('[Audio Queue] Clearing queue')
  audioQueue = []
}

export function resumeQueue(): void {
  if (!isPlayingQueue && audioQueue.length > 0) {
    playQueue().catch(err => console.error('[Audio Queue] Error resuming queue:', err))
  }
}

export function stopQueue(): void {
  isPlayingQueue = false
  clearAudioQueue()
}

export async function playAudioChunks(audioChunks: string[], sampleRate: number = 24000): Promise<void> {
  for (const chunk of audioChunks) {
    await playAudio(chunk, sampleRate)
  }
}
