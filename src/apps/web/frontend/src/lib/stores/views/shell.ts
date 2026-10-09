import { useMemo } from 'react'
import { COMMAND_GROUPS, ROUTES, matchesRoute } from '$lib/constants/navigation'
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
  const at = (pattern: string) => matchesRoute(pattern, pathname)
  let crumbs = ['Chat']
  if (at(ROUTES.settings)) crumbs = ['Settings']
  else if (at(ROUTES.schedules)) crumbs = ['Workflows', 'Schedules']
  else if (at(ROUTES.executions)) crumbs = ['Workflows', 'Executions']
  else if (at(ROUTES.executionDetail)) crumbs = ['Executions', 'Detail']
  else if (at(ROUTES.builder) || at(ROUTES.workflowEdit)) crumbs = ['Workflows', 'Builder']
  else if (at(ROUTES.workflows)) crumbs = ['Workflows']
  return { commands, crumbs }
}
