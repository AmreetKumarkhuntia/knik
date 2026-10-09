import type { ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StoresProvider } from '$stores'
import { useShellView } from '$stores/views'

const wrapper = ({ children }: { children: ReactNode }) => (
  <StoresProvider source={{}}>{children}</StoresProvider>
)

describe('shell breadcrumbs', () => {
  it.each([
    ['/', ['Chat']],
    ['/settings', ['Settings']],
    ['/settings/', ['Settings']],
    ['/schedules', ['Workflows', 'Schedules']],
    ['/workflows', ['Workflows']],
    ['/workflows/executions', ['Workflows', 'Executions']],
    ['/workflows/create', ['Workflows', 'Builder']],
    ['/workflows/wf-1/edit', ['Workflows', 'Builder']],
    ['/executions/42', ['Executions', 'Detail']],
    ['/executions/42/extra', ['Chat']],
  ])('labels %s from the route patterns', (pathname, crumbs) => {
    const { result } = renderHook(() => useShellView(pathname, 'layout'), { wrapper })
    expect(result.current.crumbs).toEqual(crumbs)
  })
})
