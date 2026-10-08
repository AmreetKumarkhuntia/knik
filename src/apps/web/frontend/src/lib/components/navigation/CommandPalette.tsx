import { useState } from 'react'
import type { CommandPaletteProps } from '$types'
import Modal from '../surfaces/Modal'
import Input from '../forms/Input'
import Button from '../buttons/Button'
import MS from '../display/MS'

function CommandList({
  commands,
  query,
  onQueryChange,
  onSelect,
  onClose,
}: Omit<CommandPaletteProps, 'open'>) {
  const [active, setActive] = useState(0)
  const items = commands.flatMap(group => group.items)
  const choose = (id: string) => {
    onSelect(id)
    onClose()
  }
  return (
    <div>
      <Input
        autoFocus
        aria-label="Search commands"
        value={query}
        density="compact"
        placeholder="Type a command or search…"
        onChange={event => {
          onQueryChange(event.target.value)
          setActive(0)
        }}
        onKeyDown={event => {
          if (!items.length) return
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setActive(
              index => (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
            )
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            choose(items[active]?.id ?? items[0].id)
          }
        }}
      />
      <div className="mt-3 max-h-[300px] overflow-y-auto flex flex-col gap-1">
        {items.map((item, index) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`justify-start ${active === index ? 'bg-surface-3' : ''}`}
            onClick={() => choose(item.id)}
            icon={item.icon && <MS name={item.icon} />}
          >
            {item.label}
            {item.shortcut && <span className="ml-auto text-xs text-fg-4">{item.shortcut}</span>}
          </Button>
        ))}
        {!items.length && <p className="text-sm text-fg-4 p-3">No matching commands.</p>}
      </div>
    </div>
  )
}
export default function CommandPalette({ open, className, ...props }: CommandPaletteProps) {
  return (
    <Modal isOpen={open} onClose={props.onClose} title="Commands" className={className}>
      {open && <CommandList {...props} />}
    </Modal>
  )
}
