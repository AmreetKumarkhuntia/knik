import type { DemoSnapshot, DemoSource } from '$types/demo-session'
import { DEFAULT_MODE, DEFAULT_THEME, DEFAULT_DENSITY, DEFAULT_RADIUS } from '$lib/constants/themes'

export function normalizeDemoSource(source: DemoSource = {}): DemoSnapshot {
  const snapshot: DemoSnapshot = {
    conversations: [],
    activeConversationId: null,
    models: [],
    suggestions: [],
    workflows: [],
    schedules: [],
    executions: [],
    timelines: {},
    providers: [],
    voices: [],
    tools: [],
    apiKeys: [],
    chatScenarios: [],
    runScenarios: {},
    keyScenarios: [],
    ...source,
    settings: {
      provider: '',
      model: '',
      voice: '',
      temperature: 0.7,
      max_tokens: 4096,
      sample_rate: 24000,
      tts_enabled: true,
      speaking_rate: 1,
      stream_responses: false,
      send_telemetry: false,
      display_name: null,
      username: null,
      initialized: false,
      ...source.settings,
    },
    appearance: {
      mode: DEFAULT_MODE,
      accentName: DEFAULT_THEME,
      density: DEFAULT_DENSITY,
      radius: DEFAULT_RADIUS,
      ...source.appearance,
    },
  }
  if (!snapshot.conversations.some(item => item.id === snapshot.activeConversationId)) {
    snapshot.activeConversationId = null
  }
  return structuredClone(snapshot)
}
