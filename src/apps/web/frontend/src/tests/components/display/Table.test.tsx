import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '$components/buttons/Button'
import Table from '$components/display/Table'
import Checkbox from '$components/forms/Checkbox'
it('tables isolate nested actions and retain stable rows when reordered', async () => {
  const open = vi.fn(),
    remove = vi.fn(),
    user = userEvent.setup()
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'action', label: 'Actions', render: () => <Button onClick={remove}>Remove</Button> },
  ]
  const data = [
    { id: 'a', name: 'Alpha' },
    { id: 'b', name: 'Beta' },
  ]
  const view = render(
    <Table data={data} columns={columns} getRowKey={row => row.id} onRowClick={open} />
  )
  const original = screen.getByText('Alpha').closest('tr')
  await user.click(screen.getAllByRole('button', { name: 'Remove' })[0])
  expect(remove).toHaveBeenCalledTimes(1)
  expect(open).not.toHaveBeenCalled()
  await user.click(screen.getByText('Alpha'))
  expect(open).toHaveBeenCalledWith(data[0])
  view.rerender(
    <Table
      data={[...data].reverse()}
      columns={columns}
      getRowKey={row => row.id}
      onRowClick={open}
    />
  )
  expect(screen.getByText('Alpha').closest('tr')).toBe(original)
})

it('checkbox label clicks inside rows change the control without row activation', async () => {
  const rowClick = vi.fn(),
    checked = vi.fn()
  render(
    <Table
      data={[{ id: 'one' }]}
      getRowKey={row => row.id}
      onRowClick={rowClick}
      columns={[
        {
          key: 'toggle',
          label: 'Enabled',
          render: () => <Checkbox label="Toggle item" checked={false} onChange={checked} />,
        },
      ]}
    />
  )
  await userEvent.setup().click(screen.getByText('Toggle item'))
  expect(checked).toHaveBeenCalledWith(true)
  expect(rowClick).not.toHaveBeenCalled()
})
