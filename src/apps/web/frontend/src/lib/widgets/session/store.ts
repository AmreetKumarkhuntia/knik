import { createStore } from 'zustand/vanilla'
import type { DemoSession, DemoSource } from '$types/demo-session'
import type { Conversation } from '$types/conversation'
import { normalizeDemoSource } from './seed'

export function createDemoSessionStore(source?: DemoSource) {
  const initial = normalizeDemoSource(source)
  let nextToastId = 0
  return createStore<DemoSession>()((set, get) => ({
    ...initial,
    toasts: [],
    startConversation: () => {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const conversation: Conversation = {
        id,
        title: 'New conversation',
        messages: [],
        created_at: now,
        updated_at: now,
        summary_message_id: null,
        compacted_count: 0,
        total_tokens: 0,
      }
      set(state => ({
        conversations: [conversation, ...state.conversations],
        activeConversationId: id,
      }))
      return id
    },
    selectConversation: id =>
      set(state => ({
        activeConversationId: state.conversations.some(c => c.id === id) ? id : null,
      })),
    renameConversation: (id, title) => {
      if (!title.trim()) return
      set(state => ({
        conversations: state.conversations.map(c =>
          c.id === id ? { ...c, title: title.trim() } : c
        ),
      }))
    },
    deleteConversation: id =>
      set(state => ({
        conversations: state.conversations.filter(c => c.id !== id),
        activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
      })),
    clearConversations: () => set({ conversations: [], activeConversationId: null }),
    sendMessage: (text, modelId) => {
      const prompt = text.trim()
      if (!prompt) return { ok: false, error: 'Enter a message.' }
      const scenario = get().chatScenarios.find(
        s => s.prompt.trim() === prompt && (!s.modelId || s.modelId === modelId)
      )
      if (!scenario) return { ok: false, error: 'No demo response is supplied for this message.' }
      const id = get().activeConversationId ?? get().startConversation()
      const timestamp = new Date().toISOString()
      set(state => ({
        conversations: state.conversations.map(c =>
          c.id === id
            ? {
                ...c,
                title: c.messages.length ? c.title : prompt.slice(0, 60),
                messages: [
                  ...c.messages,
                  {
                    id: crypto.randomUUID(),
                    role: 'user' as const,
                    content: prompt,
                    timestamp,
                    metadata: {},
                  },
                  ...structuredClone(scenario.replies),
                ],
                updated_at: timestamp,
                preview: scenario.replies.at(-1)?.content ?? prompt,
                message_count: c.messages.length + 1 + scenario.replies.length,
              }
            : c
        ),
      }))
      return { ok: true, id }
    },
    updateSettings: patch => set(state => ({ settings: { ...state.settings, ...patch } })),
    updateAppearance: patch => set(state => ({ appearance: { ...state.appearance, ...patch } })),
    saveWorkflow: workflow => {
      if (!workflow.name.trim()) return { ok: false, error: 'Workflow name is required.' }
      const copy = structuredClone(workflow)
      set(state => ({
        workflows: state.workflows.some(w => w.id === copy.id)
          ? state.workflows.map(w => (w.id === copy.id ? copy : w))
          : [...state.workflows, copy],
      }))
      return { ok: true, id: copy.id }
    },
    addSchedule: draft => {
      if (!get().workflows.some(w => w.id === draft.target_workflow_id))
        return { ok: false, error: 'Choose an existing workflow.' }
      if (!draft.schedule_description.trim()) return { ok: false, error: 'Describe the schedule.' }
      const id = Math.max(0, ...get().schedules.map(s => s.id)) + 1
      set(state => ({
        schedules: [
          ...state.schedules,
          {
            id,
            ...draft,
            schedule_description: draft.schedule_description.trim(),
            timezone: draft.timezone || 'UTC',
            enabled: true,
          },
        ],
      }))
      return { ok: true, id }
    },
    toggleSchedule: (id, enabled) =>
      set(state => ({
        schedules: state.schedules.map(s => (s.id === id ? { ...s, enabled } : s)),
      })),
    deleteSchedule: id => set(state => ({ schedules: state.schedules.filter(s => s.id !== id) })),
    runWorkflow: id => {
      const scenario = get().runScenarios[id]
      if (!scenario || !get().workflows.some(w => w.id === id))
        return { ok: false, error: 'No demo run is supplied for this workflow.' }
      const { execution, timeline } = structuredClone(scenario)
      set(state => ({
        executions: [...state.executions.filter(e => e.id !== execution.id), execution],
        timelines: { ...state.timelines, [execution.id]: timeline },
      }))
      return { ok: true, id: execution.id }
    },
    toggleTool: (name, enabled) =>
      set(state => ({ tools: state.tools.map(t => (t.name === name ? { ...t, enabled } : t)) })),
    createDemoKey: label => {
      const scenario = get().keyScenarios.find(k => k.label === label.trim())
      if (!scenario) return { ok: false, error: 'No demo key is supplied for this label.' }
      if (get().apiKeys.some(k => k.id === scenario.id))
        return { ok: false, error: 'This demo key is already listed.' }
      const record = {
        id: scenario.id,
        label: scenario.label,
        key_prefix: scenario.key_prefix,
        scopes: scenario.scopes,
      }
      set(state => ({
        apiKeys: [
          ...state.apiKeys,
          { ...structuredClone(record), created_at: null, last_used_at: null },
        ],
      }))
      return { ok: true, id: record.id }
    },
    deleteKey: id => set(state => ({ apiKeys: state.apiKeys.filter(k => k.id !== id) })),
    addToast: (message, type = 'info') =>
      set(state => ({ toasts: [...state.toasts, { id: ++nextToastId, message, type }] })),
    hideToast: id => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  }))
}
