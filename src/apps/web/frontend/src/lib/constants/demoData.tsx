/**
 * Demo / sample data for showcase components.
 *
 * These arrays are the default props for components that can render
 * standalone (CommandPalette, NotificationFeed, VoicePicker, McpToolsPanel,
 * ConversationHistory). Kept out of the component files so the components
 * stay presentational and the sample content lives in one place.
 */
import React from 'react'
import type { Conversation } from '$sections/chat/ConversationHistory'
import type { CommandGroup } from '$components/CommandPalette'
import type { NotificationItem } from '$components/NotificationFeed'
import type { Voice } from '$components/VoicePicker'
import type { McpTool } from '$components/McpToolsPanel'

export const DEFAULT_CONVERSATIONS: Conversation[] = [
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
    title: (
      <React.Fragment>
        <b>Daily digest</b> finished in{' '}
        <code className="font-mono text-[11.5px] bg-[var(--bg-code)] text-[var(--aurora-300)] px-1.5 py-[1px] rounded-[3px] border border-[var(--border-1)]">
          12.4s
        </code>
      </React.Fragment>
    ),
    time: '2 min ago · ex-9210',
    unread: true,
  },
  {
    id: '2',
    type: 'fail',
    title: (
      <React.Fragment>
        <b>GitHub digest</b> failed · SMTP relay denied
      </React.Fragment>
    ),
    time: '11 min ago · ex-9207',
    unread: true,
  },
  {
    id: '3',
    type: 'info',
    title: (
      <React.Fragment>
        New voice{' '}
        <code className="font-mono text-[11.5px] bg-[var(--bg-code)] text-[var(--aurora-300)] px-1.5 py-[1px] rounded-[3px] border border-[var(--border-1)]">
          am_ryan
        </code>{' '}
        is available
      </React.Fragment>
    ),
    time: '1 h ago · system',
    unread: true,
  },
  {
    id: '4',
    type: 'user',
    title: (
      <React.Fragment>
        <b>Jay K.</b> shared <b>"Voice notes → tasks"</b> with you
      </React.Fragment>
    ),
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
