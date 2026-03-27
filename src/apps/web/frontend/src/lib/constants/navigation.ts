export const ROUTES = {
  home: '/',
  workflows: '/workflows',
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

export const NAV_ITEMS = [
  {
    path: ROUTES.home,
    label: 'Chat',
    icon: 'Chat',
  },
  {
    path: ROUTES.workflows,
    label: 'Workflows',
    icon: 'AccountTree',
  },
]
