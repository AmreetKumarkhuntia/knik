import { createStore } from 'zustand/vanilla'
import type { DemoSnapshot } from '$types/demo-session'
import type { ChatState } from '$types/stores/chat'
import { createChatActions } from './actions'
export function createChatStore(seed: DemoSnapshot) {
  return createStore<ChatState>()((set, get) => ({
    conversations: structuredClone(seed.conversations),
    activeConversationId: seed.activeConversationId,
    chatScenarios: structuredClone(seed.chatScenarios),
    scopes: {},
    autoTitles: {},
    ...createChatActions(set, get),
  }))
}
