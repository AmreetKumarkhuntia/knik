import Button from '$components/buttons/Button'
import { Modal, Kbd } from '$components'
import type { KeyboardShortcutsProps } from '$types/sections/home'
import { KEYBOARD_SHORTCUT_ITEMS as shortcuts } from '$lib/constants'

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <div className="flex flex-col">
        {shortcuts.map(shortcut => (
          <div
            key={shortcut.key}
            className="flex items-center justify-between gap-3 py-2.5 border-t border-border-1 first:border-t-0"
          >
            <span className="text-body text-fg-2">{shortcut.description}</span>
            {/* Kbd sets its own colour, padding and radius; utility order would otherwise decide. */}
            <Kbd className="shrink-0 whitespace-nowrap !text-fg-1 !px-[7px] !py-[5px] !rounded-xs">
              {shortcut.key}
            </Kbd>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-4">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
