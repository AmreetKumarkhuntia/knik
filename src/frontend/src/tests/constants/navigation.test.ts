import { describe, expect, it } from 'vitest'
import { COMMAND_GROUPS, ROUTE_PATHS, ROUTES, matchesRoute } from '$lib/constants/navigation'

describe('route paths', () => {
  it('builds encoded paths that match their route patterns', () => {
    expect(ROUTE_PATHS.workflowEdit('daily digest/v2')).toBe('/workflows/daily%20digest%2Fv2/edit')
    expect(ROUTE_PATHS.executionDetail(42)).toBe('/executions/42')
    expect(ROUTE_PATHS.settingsTab('keys')).toBe('/settings?tab=keys')
    expect(matchesRoute(ROUTES.workflowEdit, ROUTE_PATHS.workflowEdit('a/b'))).toBe(true)
    expect(matchesRoute(ROUTES.executionDetail, ROUTE_PATHS.executionDetail('9'))).toBe(true)
  })

  it('matches patterns the way the router does', () => {
    expect(matchesRoute(ROUTES.home, '/')).toBe(true)
    expect(matchesRoute(ROUTES.settings, '/settings/')).toBe(true)
    expect(matchesRoute(ROUTES.settings, '/Settings')).toBe(true)
    expect(matchesRoute(ROUTES.workflowEdit, '/workflows/create')).toBe(false)
    expect(matchesRoute(ROUTES.workflowEdit, '/workflows//edit')).toBe(false)
    expect(matchesRoute(ROUTES.executionDetail, '/executions/1/extra')).toBe(false)
    expect(matchesRoute(ROUTES.workflows, '/workflows/executions')).toBe(false)
  })

  it('gives every palette command a route unless MainLayout handles its id', () => {
    const unrouted = COMMAND_GROUPS.flatMap(group => group.items)
      .filter(item => !item.path)
      .map(item => item.id)
    expect(unrouted).toEqual(['new-chat'])
  })
})
