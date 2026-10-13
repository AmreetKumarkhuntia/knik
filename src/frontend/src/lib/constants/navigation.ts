import type { CommandGroup } from '$types/components/navigation'

/** Route patterns, as declared in App. Build parameterised paths with ROUTE_PATHS. */
export const ROUTES = {
  home: '/',
  workflows: '/workflows',
  builder: '/workflows/create',
  workflowEdit: '/workflows/:id/edit',
  executions: '/workflows/executions',
  executionDetail: '/executions/:id',
  schedules: '/schedules',
  settings: '/settings',
}

/** Search param the Settings route reads to open a specific pane, e.g. /settings?tab=keys. */
export const SETTINGS_TAB_PARAM = 'tab'

const withId = (pattern: string, id: string | number) =>
  pattern.replace(':id', encodeURIComponent(id))

/** Concrete paths for the parameterised ROUTES. */
export const ROUTE_PATHS = {
  workflowEdit: (id: string) => withId(ROUTES.workflowEdit, id),
  executionDetail: (id: string | number) => withId(ROUTES.executionDetail, id),
  settingsTab: (tab: string) =>
    `${ROUTES.settings}?${SETTINGS_TAB_PARAM}=${encodeURIComponent(tab)}`,
}

/**
 * Whether a pathname matches a ROUTES pattern the way the router does: each `:param` matches one
 * non-empty segment, case is ignored and a trailing slash is allowed. ROUTES segments are plain
 * words, so they need no regex escaping.
 */
export function matchesRoute(pattern: string, pathname: string) {
  const segments = pattern.split('/').map(segment => (segment.startsWith(':') ? '[^/]+' : segment))
  return new RegExp(`^${segments.join('/')}/?$`, 'i').test(pathname)
}

// macOS users press ⌘ while other platforms use Ctrl, so each global chord binds both.
const withCommandKey = (key: string) => [
  { key, metaKey: true },
  { key, ctrlKey: true },
]

/** Global chords handled by MainLayout. */
export const KEYBOARD_SHORTCUTS = {
  commandPalette: withCommandKey('k'),
  newChat: withCommandKey('j'),
}

/** Primary workspace navigation. Icons are Material Symbols Outlined names. */
export const NAV_ITEMS = [
  {
    path: ROUTES.home,
    label: 'Chat',
    icon: 'forum',
  },
  {
    path: ROUTES.workflows,
    label: 'Workflows',
    icon: 'account_tree',
  },
  {
    path: ROUTES.builder,
    label: 'Builder',
    icon: 'polyline',
  },
  {
    path: ROUTES.schedules,
    label: 'Schedules',
    icon: 'schedule',
  },
]

/** Command palette entries. MainLayout opens a command's path, or handles its id when it has none. */
export const COMMAND_GROUPS: CommandGroup[] = [
  {
    group: 'Actions',
    items: [{ id: 'new-chat', label: 'New chat', shortcut: '⌘ J', icon: 'add' }],
  },
  {
    group: 'Navigate',
    items: [
      { id: 'nav-home', label: 'Go to Chat', icon: 'forum', path: ROUTES.home },
      {
        id: 'nav-workflows',
        label: 'Go to Workflows',
        icon: 'account_tree',
        path: ROUTES.workflows,
      },
      { id: 'nav-builder', label: 'Open Workflow Builder', icon: 'polyline', path: ROUTES.builder },
      { id: 'nav-schedules', label: 'Go to Schedules', icon: 'schedule', path: ROUTES.schedules },
      { id: 'nav-settings', label: 'Open Settings', icon: 'settings', path: ROUTES.settings },
      {
        id: 'nav-keys',
        label: 'Manage API keys',
        icon: 'key',
        path: ROUTE_PATHS.settingsTab('keys'),
      },
    ],
  },
]

/** Keyboard shortcuts listed in the KeyboardShortcuts help modal. */
export const KEYBOARD_SHORTCUT_ITEMS = [
  { key: '⌘ / Ctrl + K', description: 'Open command palette' },
  { key: '⌘ / Ctrl + J', description: 'New chat' },
  { key: 'Esc', description: 'Clear input' },
  { key: 'Enter', description: 'Send message' },
  { key: '?', description: 'Open shortcuts outside text fields' },
  { key: '⌘ / Ctrl + /', description: 'Toggle shortcuts help' },
]
