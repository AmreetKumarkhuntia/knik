import type { DemoSource } from '$types/stores/demo'

// Sample key metadata never includes a generated or real secret.
export const demoSettings = {
  settings: {
    display_name: 'Amreet Kumar',
    username: 'amreet',
    provider: 'google',
    model: 'gemini-1.5-flash',
    voice: 'af_heart',
  },
  apiKeys: [
    {
      id: 'k1',
      label: 'Demo · Production',
      key_prefix: 'knik_live_8f3a',
      scopes: ['full'],
      created_at: '2026-03-02T00:00:00.000Z',
      last_used_at: null,
    },
    {
      id: 'k2',
      label: 'Demo · CI / Deploy',
      key_prefix: 'knik_ci_2b91',
      scopes: ['write'],
      created_at: '2026-02-18T00:00:00.000Z',
      last_used_at: null,
    },
    {
      id: 'k3',
      label: 'Demo · Read-only',
      key_prefix: 'knik_ro_77de',
      scopes: ['read'],
      created_at: '2026-01-30T00:00:00.000Z',
      last_used_at: null,
    },
  ],
  keyScenarios: [],
} satisfies DemoSource
