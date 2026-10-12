import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Table from '$components/display/Table'

it('tables retain stable rows when reordered', () => {
  const columns = [{ key: 'name', label: 'Name' }]
  const data = [
    { id: 'a', name: 'Alpha' },
    { id: 'b', name: 'Beta' },
  ]
  const view = render(<Table data={data} columns={columns} getRowKey={row => row.id} />)
  const original = screen.getByText('Alpha').closest('tr')
  view.rerender(<Table data={[...data].reverse()} columns={columns} getRowKey={row => row.id} />)
  expect(screen.getByText('Alpha').closest('tr')).toBe(original)
})
