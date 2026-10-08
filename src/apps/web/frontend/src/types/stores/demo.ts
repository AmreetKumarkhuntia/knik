import type { ReactNode } from 'react'
import type { Conversation, ConversationMessage } from '../conversation'
import type { McpTool } from '../components/product'
import type { ChatModelOption } from '../components/chat'
import type { Workflow, Schedule, ExecutionDetail, NodeExecutionStep } from '../workflow'
import type {
  FrontendSettings,
  AdminOption,
  McpToolInfo,
  ApiKeyInfo,
  ApiKeyCreated,
} from '../sections/settings'
import type { ThemeMode, ThemeName, Density, Radius } from '../theme'

export interface AppearanceSettings {
  mode: ThemeMode
  accentName: ThemeName
  density: Density
  radius: Radius
}
export interface DemoSuggestion {
  id: string
  icon: string
  title: string
  subtitle: string
  tag?: string
}
export interface DemoChatScenario {
  prompt: string
  modelId?: string
  replies: ConversationMessage[]
}
export interface DemoRunScenario {
  execution: ExecutionDetail
  timeline: NodeExecutionStep[]
}
export interface DemoVoiceOption extends AdminOption {
  audioSrc?: string
  lang?: string
  tags?: string[]
}
export interface CatalogModel extends ChatModelOption {
  providerId?: string
}
export interface DemoSnapshot {
  conversations: Conversation[]
  activeConversationId: string | null
  models: CatalogModel[]
  suggestions: DemoSuggestion[]
  workflows: Workflow[]
  schedules: Schedule[]
  executions: ExecutionDetail[]
  timelines: Record<string, NodeExecutionStep[]>
  settings: FrontendSettings
  appearance: AppearanceSettings
  providers: AdminOption[]
  voices: DemoVoiceOption[]
  tools: McpToolInfo[]
  toolDefinitions: McpTool[]
  apiKeys: ApiKeyInfo[]
  chatScenarios: DemoChatScenario[]
  runScenarios: Partial<Record<string, DemoRunScenario>>
  keyScenarios: ApiKeyCreated[]
}
export type DemoSource = Partial<Omit<DemoSnapshot, 'settings' | 'appearance'>> & {
  settings?: Partial<FrontendSettings>
  appearance?: Partial<AppearanceSettings>
}
export type DemoActionResult = { ok: true; id?: string | number } | { ok: false; error: string }
export interface DemoToast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}
export interface ScheduleDraft {
  target_workflow_id: string
  schedule_description: string
  timezone?: string
}
export interface StoresProviderProps {
  children: ReactNode
  source?: DemoSource
}
