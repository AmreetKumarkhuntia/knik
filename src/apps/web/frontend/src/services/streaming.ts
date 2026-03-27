interface StreamCallbacks {
  onText?: (chunk: string) => void
  onAudio?: (audioBase64: string) => void
  onComplete?: (audioChunkCount: number) => void
  onError?: (error: string) => void
  onConversationId?: (conversationId: string) => void
}

interface StreamOptions {
  conversationId?: string
}

/**
 * Stream chat with AI - receives text and audio progressively
 * Uses fetch with POST body to send message and stream response
 *
 * @param message - User message to send
 * @param callbacks - Event handlers for text, audio, completion, and errors
 * @param options - Optional stream config (e.g. conversationId for persistence)
 * @returns AbortController (can be aborted to cancel stream)
 *
 * @example
 * ```typescript
 * const controller = streamChat("Hello!", {
 *   onText: (chunk) => console.log("Text:", chunk),
 *   onAudio: (audio) => playAudio(audio),
 *   onComplete: (count) => console.log(`Done! ${count} audio chunks`),
 *   onError: (err) => console.error(err),
 *   onConversationId: (id) => console.log("Conversation:", id)
 * });
 *
 * // To abort: controller.abort();
 * ```
 */
export async function streamChat(
  message: string,
  callbacks: StreamCallbacks,
  options?: StreamOptions
): Promise<AbortController> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const url = `${apiUrl}/api/chat/stream`

  const abortController = new AbortController()

  try {
    const body: Record<string, unknown> = { message }
    if (options?.conversationId) {
      body.conversation_id = options.conversationId
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: abortController.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    let currentEvent = ''
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- reader is always truthy when ReadableStream exists
    while (reader) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.substring(6).trim()
          continue
        }

        if (line.startsWith('data:')) {
          const data = line.substring(5).trim()

          try {
            const parsed = JSON.parse(data)

            if (
              currentEvent === 'conversation_id' &&
              callbacks.onConversationId &&
              parsed.conversation_id
            ) {
              callbacks.onConversationId(parsed.conversation_id)
            } else if (currentEvent === 'text' && callbacks.onText && parsed.text) {
              callbacks.onText(parsed.text)
            } else if (currentEvent === 'audio' && callbacks.onAudio && parsed.audio) {
              callbacks.onAudio(parsed.audio)
            } else if (currentEvent === 'done' && callbacks.onComplete) {
              callbacks.onComplete(parsed.audio_count || 0)
            } else if (currentEvent === 'error' && callbacks.onError) {
              callbacks.onError(parsed.error || 'Unknown error')
            }
          } catch (e) {
            console.error('[Streaming] Failed to parse SSE JSON:', e, data)
          }

          currentEvent = ''
        }
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name !== 'AbortError' && callbacks.onError) {
      callbacks.onError(error.message || 'Stream error')
    }
  }

  return abortController
}
