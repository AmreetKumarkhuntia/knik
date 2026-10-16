import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSettingsTransport } from '$lib/transport/settings'

function answer(status: number, body: unknown, statusText = '') {
  return vi.fn(async () =>
    typeof body === 'string'
      ? new Response(body, { status, statusText })
      : Response.json(body, { status, statusText })
  )
}

describe('settings transport', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads the base URL and API key from the build environment', async () => {
    vi.stubEnv('VITE_KNIK_API_URL', 'https://knik.example/')
    vi.stubEnv('VITE_KNIK_API_KEY', 'secret-key')
    const fetcher = answer(200, { settings: [] })
    vi.stubGlobal('fetch', fetcher)
    await createSettingsTransport().reset('voice name')
    expect(fetcher).toHaveBeenCalledWith(
      'https://knik.example/api/admin/settings/voice%20name',
      expect.objectContaining({
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'secret-key' },
      })
    )
  })

  it('defaults to the local backend, sends only changed keys and omits the key header', async () => {
    vi.stubEnv('VITE_KNIK_API_URL', undefined)
    vi.stubEnv('VITE_KNIK_API_KEY', undefined)
    const fetcher = answer(200, { status: 'success' })
    vi.stubGlobal('fetch', fetcher)
    await createSettingsTransport().save({ temperature: 0.3, max_tokens: null })
    expect(fetcher).toHaveBeenCalledWith('http://localhost:8010/api/admin/settings', {
      method: 'POST',
      body: '{"temperature":0.3,"max_tokens":null}',
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('returns the settings list and rejects a body without one', async () => {
    vi.stubGlobal('fetch', answer(200, { settings: [{ key: 'ai_model' }] }))
    expect(await createSettingsTransport().load()).toEqual([{ key: 'ai_model' }])
    vi.stubGlobal('fetch', answer(200, { detail: 'nothing here' }))
    await expect(createSettingsTransport().load()).rejects.toThrow(
      'Unexpected response from the settings API'
    )
  })

  it.each([
    [422, { detail: 'temperature must be float' }, 'temperature must be float'],
    [
      422,
      { detail: [{ msg: 'Input should be a valid dictionary' }, { msg: 'extra' }] },
      'Input should be a valid dictionary; extra',
    ],
    [502, 'Bad Gateway', '502 Bad Gateway'],
    [
      401,
      { detail: 'Missing API key' },
      'Missing API key Set VITE_KNIK_API_KEY to the key the backend requires.',
    ],
  ])('turns a %s response into an error message', async (status, body, message) => {
    vi.stubGlobal('fetch', answer(status, body, status === 502 ? 'Bad Gateway' : ''))
    await expect(createSettingsTransport().load()).rejects.toThrow(message)
  })
})
