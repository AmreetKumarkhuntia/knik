import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '$components/buttons/Button'
import ConfirmDialog from '$components/surfaces/ConfirmDialog'
import Modal from '$components/surfaces/Modal'
import Popover from '$components/surfaces/Popover'
function DialogExample({ placement = 'center' }: { placement?: 'center' | 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit" placement={placement}>
        <Button>First</Button>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </Modal>
    </>
  )
}
describe('overlay ownership', () => {
  it.each(['left', 'right'] as const)(
    '%s drawer traps focus and restores its trigger',
    async placement => {
      const user = userEvent.setup()
      render(<DialogExample placement={placement} />)
      await user.click(screen.getByRole('button', { name: 'Open' }))
      expect(screen.getByRole('button', { name: 'Close Edit' })).toHaveFocus()
      await user.tab({ shift: true })
      expect(screen.getByRole('button', { name: /^Close$/ })).toHaveFocus()
      await user.tab()
      expect(screen.getByRole('button', { name: 'Close Edit' })).toHaveFocus()
      await user.keyboard('{Escape}')
      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(document.body.style.overflow).toBe('')
    }
  )
  it('names a hidden title for assistive tech without drawing the header', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Commands" titleHidden>
        <Button>Inner</Button>
      </Modal>
    )
    expect(screen.getByRole('dialog', { name: 'Commands' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Commands' })).toHaveClass('sr-only')
    expect(screen.queryByRole('button', { name: 'Close Commands' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inner' })).toHaveFocus()
  })
  it('confirm dialog leads with its warning tile and relies on Cancel instead of a close button', () => {
    render(
      <ConfirmDialog
        isOpen
        title="Delete conversation"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    const dialog = screen.getByRole('dialog', { name: 'Delete conversation' })
    const tile = within(dialog).getByText('warning')
    const heading = within(dialog).getByRole('heading', { name: 'Delete conversation' })
    expect(tile.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(dialog).queryByRole('button', { name: /^Close/ })).not.toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })
  it('draws the drawer close control with a hidden Material Symbols icon', async () => {
    const user = userEvent.setup()
    render(<DialogExample placement="right" />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const close = screen.getByRole('button', { name: 'Close Edit' })
    expect(close).toHaveTextContent(/^close$/)
    expect(close.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
  it('traps dialog focus, restores it and unlocks scrolling', async () => {
    const user = userEvent.setup()
    render(<DialogExample />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('dialog', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Close Edit' })).toHaveFocus()
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
  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: 'Second dialog' })).not.toBeInTheDocument()
  )
  expect(screen.getByRole('dialog', { name: 'First dialog' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Open second' })).toHaveFocus()
  expect(document.body.style.overflow).toBe('hidden')
  await user.keyboard('{Escape}')
  expect(screen.getByRole('button', { name: 'Open first' })).toHaveFocus()
  expect(document.body.style.overflow).toBe('')
})
