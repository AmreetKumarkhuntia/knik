import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '$components/buttons/Button'
import Modal from '$components/surfaces/Modal'
import Popover from '$components/surfaces/Popover'
function DialogExample() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit">
        <Button>First</Button>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </Modal>
    </>
  )
}
describe('overlay ownership', () => {
  it('traps dialog focus, restores it and unlocks scrolling', async () => {
    const user = userEvent.setup()
    render(<DialogExample />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('dialog', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })
  it('popover uses one trigger and closes on outside interaction', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Popover
          label="Options"
          renderTrigger={props => <Button {...props}>More</Button>}
          content={<Button>Option</Button>}
        />
        <p>Outside</p>
      </>
    )
    expect(screen.getAllByRole('button')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'More' }))
    expect(screen.getByRole('dialog', { name: 'Options' })).toBeInTheDocument()
    fireEvent.pointerDown(screen.getByText('Outside'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

function StackedDialogs() {
  const [first, setFirst] = useState(false),
    [second, setSecond] = useState(false)
  return (
    <>
      <Button onClick={() => setFirst(true)}>Open first</Button>
      <Modal title="First dialog" isOpen={first} onClose={() => setFirst(false)}>
        <Button onClick={() => setSecond(true)}>Open second</Button>
        <Modal title="Second dialog" isOpen={second} onClose={() => setSecond(false)}>
          <Button>Inner action</Button>
        </Modal>
      </Modal>
    </>
  )
}
it('Escape closes only the top dialog and keeps the lower dialog scroll lock', async () => {
  const user = userEvent.setup()
  render(<StackedDialogs />)
  await user.click(screen.getByRole('button', { name: 'Open first' }))
  await user.click(screen.getByRole('button', { name: 'Open second' }))
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog', { name: 'Second dialog' })).not.toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'First dialog' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Open second' })).toHaveFocus()
  expect(document.body.style.overflow).toBe('hidden')
  await user.keyboard('{Escape}')
  expect(screen.getByRole('button', { name: 'Open first' })).toHaveFocus()
  expect(document.body.style.overflow).toBe('')
})
