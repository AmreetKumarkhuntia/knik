export const ROUTES = {
  home: '/',
  workflows: '/workflows',
  builder: '/workflows/create',
  executions: '/workflows/executions',
  schedules: '/schedules',
  settings: '/settings',
}

export const KEYBOARD_SHORTCUTS = {
  focusInput: {
    key: 'k',
    ctrlKey: true,
  },
  clearInput: {
    key: 'Escape',
  },
  toggleShortcuts: {
    key: '?',
    ctrlKey: false,
  },
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

/** Command palette entries (ids handled by MainLayout). */
export const COMMAND_GROUPS = [
  {
    group: 'Actions',
    items: [{ id: 'new-chat', label: 'New chat', shortcut: '⌘ J', icon: 'add' }],
  },
  {
    group: 'Navigate',
    items: [
      { id: 'nav-home', label: 'Go to Chat', icon: 'forum' },
      { id: 'nav-workflows', label: 'Go to Workflows', icon: 'account_tree' },
      { id: 'nav-builder', label: 'Open Workflow Builder', icon: 'polyline' },
      { id: 'nav-schedules', label: 'Go to Schedules', icon: 'schedule' },
      { id: 'nav-settings', label: 'Open Settings', icon: 'settings' },
      { id: 'nav-keys', label: 'Manage API keys', icon: 'key' },
    ],
  },
]

/** Keyboard shortcuts listed in the KeyboardShortcuts help modal. */
export const KEYBOARD_SHORTCUT_ITEMS = [
  { key: 'Ctrl + K', description: 'Focus input field' },
  { key: 'Esc', description: 'Clear input' },
  { key: 'Enter', description: 'Send message' },
  { key: '?', description: 'Toggle this panel' },
  { key: 'Ctrl + /', description: 'Open shortcuts help' },
]
