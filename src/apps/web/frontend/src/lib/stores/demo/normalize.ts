import type { DemoSnapshot, DemoSource } from '$types/stores/demo'
import { DEFAULT_MODE } from '$lib/constants/themes'

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
    toolDefinitions: [],
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
      mode: source.appearance?.mode === 'light' ? 'light' : DEFAULT_MODE,
    },
  }
  if (!snapshot.conversations.some(item => item.id === snapshot.activeConversationId)) {
    snapshot.activeConversationId = null
  }
  return structuredClone(snapshot)
}
