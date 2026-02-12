/**
 * Streaming Chat API Client
 * Handles Server-Sent Events (SSE) for real-time text and audio streaming
 */

import { useState, useRef } from 'react';

interface StreamCallbacks {
  onText?: (chunk: string) => void;
  onAudio?: (audioBase64: string) => void;
  onComplete?: (audioChunkCount: number) => void;
  onError?: (error: string) => void;
}

/**
 * Stream chat with AI - receives text and audio progressively
 * Uses fetch with POST body to send message and stream response
 *
 * @param message - User message to send
 * @param callbacks - Event handlers for text, audio, completion, and errors
 * @returns AbortController (can be aborted to cancel stream)
 *
 * @example
 * ```typescript
 * const controller = streamChat("Hello!", {
 *   onText: (chunk) => console.log("Text:", chunk),
 *   onAudio: (audio) => playAudio(audio),
 *   onComplete: (count) => console.log(`Done! ${count} audio chunks`),
 *   onError: (err) => console.error(err)
 * });
 *
 * // To abort: controller.abort();
 * ```
 */
export async function streamChat(message: string, callbacks: StreamCallbacks): Promise<AbortController> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const url = `${apiUrl}/api/chat/stream`;

  const abortController = new AbortController();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    let currentEvent = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.substring(6).trim();
          continue;
        }

        if (line.startsWith('data:')) {
          const data = line.substring(5).trim();

          try {
            const parsed = JSON.parse(data);
            
            if (currentEvent === 'text' && callbacks.onText && parsed.text) {
              callbacks.onText(parsed.text);
            } else if (currentEvent === 'audio' && callbacks.onAudio && parsed.audio) {
              callbacks.onAudio(parsed.audio);
            } else if (currentEvent === 'done' && callbacks.onComplete) {
              callbacks.onComplete(parsed.audio_count || 0);
            } else if (currentEvent === 'error' && callbacks.onError) {
              callbacks.onError(parsed.error || 'Unknown error');
            }
          } catch (e) {
            console.error('[Streaming] Failed to parse SSE JSON:', e, data);
          }

          currentEvent = ''; // Reset after processing
        }
      }
    }
  } catch (error: any) {
    if (error.name !== 'AbortError' && callbacks.onError) {
      callbacks.onError(error.message || 'Stream error');
    }
  }

  return abortController;
}

/**
 * Helper: Convert base64 audio to playable audio
 */
export function playBase64Audio(audioBase64: string, _sampleRate: number = 24000): void {
  // Decode base64 to binary
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create blob and URL
  const blob = new Blob([bytes], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);

  // Play audio
  const audio = new Audio(url);
  audio.play();

  // Cleanup URL after playback
  audio.onended = () => URL.revokeObjectURL(url);
}

/**
 * Example usage component (React)
 */
export function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [fullText, setFullText] = useState("");
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = async (message: string) => {
    setIsStreaming(true);
    setFullText("");
    setAudioQueue([]);

    abortControllerRef.current = await streamChat(message, {
      onText: (chunk) => {
        setFullText((prev) => prev + chunk);
      },
      onAudio: (audioBase64) => {
        setAudioQueue((prev) => [...prev, audioBase64]);
        // Auto-play audio as it arrives
        playBase64Audio(audioBase64);
      },
      onComplete: (count) => {
        console.log(`Streaming complete: ${count} audio chunks`);
        setIsStreaming(false);
      },
      onError: (error) => {
        console.error("Stream error:", error);
        setIsStreaming(false);
      },
    });
  };

  const cancelStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  return { sendMessage, cancelStream, isStreaming, fullText, audioQueue };
}
