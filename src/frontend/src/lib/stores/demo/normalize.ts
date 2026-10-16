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
    apiKeys: [],
    chatScenarios: [],
    runScenarios: {},
    ...source,
    settings: {
      model: '',
      display_name: null,
      username: null,
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
