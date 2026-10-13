import { useId, useState } from 'react'
import type { CommandPaletteProps } from '$types'
import Modal from '../surfaces/Modal'
import Input from '../forms/Input'
import Button from '../buttons/Button'
import Kbd from '../display/Kbd'
import MS from '../display/MS'

function CommandList({
  commands,
  query,
  onQueryChange,
  onSelect,
  onClose,
}: Omit<CommandPaletteProps, 'open'>) {
  const [active, setActive] = useState(0)
  const listboxId = useId()
  const items = commands.flatMap(group => group.items)
  const optionId = (index: number) => `${listboxId}-option-${index}`
  const choose = (id: string) => {
    onSelect(id)
    onClose()
  }
  return (
    <div>
      <div className="flex items-center gap-2.5 pl-3 pr-2.5 py-1 rounded-[12px] bg-panel border border-border-1 transition-colors focus-within:border-[var(--acc-border)]">
        <MS name="search" size={20} className="text-fg-4" />
        <Input
          autoFocus
          role="combobox"
          aria-label="Search commands"
          aria-expanded="true"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={items.length ? optionId(active) : undefined}
          value={query}
          placeholder="Type a command or search…"
          className="!px-0 border-0 bg-transparent text-body-lg focus:shadow-none"
          onChange={event => {
            onQueryChange(event.target.value)
            setActive(0)
          }}
          onKeyDown={event => {
            if (!items.length) return
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setActive(
                index =>
                  (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
              )
            }
            if (event.key === 'Enter') {
              event.preventDefault()
              choose(items[active]?.id ?? items[0].id)
            }
          }}
        />
        <Kbd className="bg-transparent text-fg-4">esc</Kbd>
      </div>
      <div
        id={listboxId}
        role="listbox"
        aria-label="Commands"
        className="mt-2 max-h-[320px] overflow-y-auto flex flex-col gap-0.5"
      >
        {/* Options stay direct listbox children, so group headers are hidden decoration. */}
        {commands.flatMap(group => [
          group.items.length > 0 && (
            <div
              key={`${group.group}-header`}
              aria-hidden="true"
              className="px-3 pt-2.5 pb-1.5 text-micro font-semibold uppercase tracking-[.08em] text-fg-4"
            >
              {group.group}
            </div>
          ),
          ...group.items.map(item => {
            const index = items.indexOf(item)
            const selected = active === index
            return (
              <Button
                key={item.id}
                id={optionId(index)}
                role="option"
                aria-selected={selected}
                variant="ghost"
                className={`w-full justify-start gap-2.5 min-h-11 md:min-h-[38px] px-3 rounded-[10px] text-body font-medium ${selected ? 'bg-[var(--acc-soft)] text-[var(--acc-text)] hover:!bg-[var(--acc-soft)] hover:!text-[var(--acc-text)]' : 'text-fg-2'}`}
                onClick={() => choose(item.id)}
                icon={item.icon && <MS name={item.icon} size={18} />}
              >
                <span className="flex-1 min-w-0 truncate text-left">{item.label}</span>
                {item.shortcut && (
                  <span className="font-mono text-micro text-fg-4">{item.shortcut}</span>
                )}
              </Button>
            )
          }),
        ])}
      </div>
      {!items.length && <p className="px-3 py-3.5 text-body text-fg-4">No matching commands.</p>}
    </div>
  )
}
export default function CommandPalette({ open, className = '', ...props }: CommandPaletteProps) {
  return (
    <Modal
      isOpen={open}
      onClose={props.onClose}
      title="Commands"
      titleHidden
      size="lg"
      className={`self-start mt-[12vh] ${className}`}
    >
      <CommandList {...props} />
    </Modal>
  )
}
