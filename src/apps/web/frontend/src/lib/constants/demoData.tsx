/** Historical sample records; not used to initialize the demo session. */
import type { ConversationHistoryItem } from '$types'
import type { CommandGroup } from '$types'
import type { NotificationItem } from '$types'
import type { Voice } from '$types'
import type { McpTool } from '$types'

export const DEFAULT_CONVERSATIONS: ConversationHistoryItem[] = [
  {
    id: '1',
    name: 'Refactor Python pipeline',
    time: '12:41',
    group: 'Today',
    tag: 'code',
    preview: 'Replace inner loop with a generator…',
    active: true,
  },
  {
    id: '2',
    name: 'API docs for /v1/synth',
    time: '11:18',
    group: 'Today',
    tag: 'docs',
    preview: 'Endpoint accepts voice + text…',
  },
  {
    id: '3',
    name: 'Debug React state',
    time: '17:24',
    group: 'Yesterday',
    tag: 'debug',
    preview: 'useEffect dependency missing…',
  },
  {
    id: '4',
    name: 'Voice notes → tasks',
    time: '09:02',
    group: 'Yesterday',
    tag: 'workflow',
    preview: 'Trigger every 15 min, summarise inbox…',
  },
  {
    id: '5',
    name: 'MCP shell tool wrapper',
    time: 'Mar 12',
    group: 'Earlier',
    tag: 'tool',
    preview: 'Wrap tar + ssh into a single call…',
  },
]

export const DEFAULT_COMMANDS: CommandGroup[] = [
  {
    group: 'Workflows',
    items: [
      { id: 'run-workflow', label: 'Run workflow…', shortcut: '⌘ R', icon: 'play_arrow' },
      { id: 'new-workflow', label: 'Create new workflow', shortcut: '⌘ N', icon: 'add' },
      { id: 'recent-executions', label: 'View recent executions', icon: 'history' },
    ],
  },
  {
    group: 'Chat',
    items: [
      { id: 'new-chat', label: 'New chat', shortcut: '⌘ J', icon: 'add_comment' },
      { id: 'change-model', label: 'Change model', icon: 'tune' },
    ],
  },
]

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'success',
    title: 'Daily digest finished in 12.4s',
    time: '2 min ago · ex-9210',
    unread: true,
  },
  {
    id: '2',
    type: 'fail',
    title: 'GitHub digest failed · SMTP relay denied',
    time: '11 min ago · ex-9207',
    unread: true,
  },
  {
    id: '3',
    type: 'info',
    title: 'New voice am_ryan is available',
    time: '1 h ago · system',
    unread: true,
  },
  {
    id: '4',
    type: 'user',
    title: 'Jay K. shared "Voice notes → tasks" with you',
    time: 'Yesterday · 17:42',
    unread: false,
  },
]

export const DEFAULT_VOICES: Voice[] = [
  { id: 'af_heart', name: 'af_heart', lang: 'en', tags: ['warm'], gradient: 'g-rose' },
  { id: 'af_bella', name: 'af_bella', lang: 'en', tags: ['bright'], gradient: 'g-amber' },
  { id: 'af_sarah', name: 'af_sarah', lang: 'en', tags: ['clear'], gradient: 'g-aurora' },
  { id: 'af_nicole', name: 'af_nicole', lang: 'en', tags: ['soft'], gradient: 'g-violet' },
  { id: 'af_sky', name: 'af_sky', lang: 'en', tags: ['airy'], gradient: 'g-emerald' },
  { id: 'am_adam', name: 'am_adam', lang: 'en', tags: ['deep'], gradient: 'g-sky' },
  { id: 'am_michael', name: 'am_michael', lang: 'en', tags: ['steady'], gradient: 'g-slate' },
  { id: 'am_leo', name: 'am_leo', lang: 'en', tags: ['rich'], gradient: 'g-zinc' },
  { id: 'am_ryan', name: 'am_ryan', lang: 'en', tags: ['casual'], gradient: 'g-stone' },
]

export const DEFAULT_TOOLS: McpTool[] = [
  {
    id: 'shell.run',
    name: 'shell.run',
    desc: 'Run a shell command and capture stdout / stderr.',
    category: 'shell',
    icon: 'terminal',
  },
  {
    id: 'file.read',
    name: 'file.read',
    desc: 'Read a file from the local sandbox.',
    category: 'file',
    icon: 'draft',
  },
  {
    id: 'file.write',
    name: 'file.write',
    desc: 'Create or overwrite a file with new content.',
    category: 'file',
    icon: 'edit_document',
  },
  {
    id: 'browser.fetch',
    name: 'browser.fetch',
    desc: 'Fetch a URL and return rendered HTML.',
    category: 'browser',
    icon: 'language',
  },
  {
    id: 'cron.schedule',
    name: 'cron.schedule',
    desc: 'Schedule a workflow with a cron expression.',
    category: 'cron',
    icon: 'schedule',
  },
  {
    id: 'text.summarise',
    name: 'text.summarise',
    desc: 'Compress a long passage to N sentences.',
    category: 'text',
    icon: 'format_align_left',
  },
]
