import { useMemo } from 'react'
import { COMMAND_GROUPS, ROUTES } from '$lib/constants/navigation'
import { useShellStore } from '../shell/hooks'
import { EMPTY_SHELL_SCOPE } from '../shell/selectors'
export function useShellView(pathname: string, scopeId: string) {
  const query = useShellStore(s => (s.scopes[scopeId] ?? EMPTY_SHELL_SCOPE).paletteQuery)
  const commands = useMemo(
    () =>
      COMMAND_GROUPS.map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.label.toLowerCase().includes(query.trim().toLowerCase())
        ),
      })).filter(group => group.items.length > 0),
    [query]
  )
  let crumbs = ['Chat']
  if (pathname === ROUTES.settings) crumbs = ['Settings']
  else if (pathname === ROUTES.schedules) crumbs = ['Workflows', 'Schedules']
  else if (pathname === ROUTES.executions) crumbs = ['Workflows', 'Executions']
  else if (pathname.startsWith('/executions/')) crumbs = ['Executions', 'Detail']
  else if (
    (pathname.startsWith('/workflows/') && pathname.endsWith('/edit')) ||
    pathname === ROUTES.builder
  )
    crumbs = ['Workflows', 'Builder']
  else if (pathname === ROUTES.workflows) crumbs = ['Workflows']
  return { commands, crumbs }
}
