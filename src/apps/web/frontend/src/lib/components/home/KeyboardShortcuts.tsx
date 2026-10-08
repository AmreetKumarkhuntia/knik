import Button from '$components/buttons/Button'
import { Modal, Kbd } from '$components'
import type { KeyboardShortcutsProps } from '$types/sections/home'
import { KEYBOARD_SHORTCUT_ITEMS as shortcuts } from '$lib/constants'

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <div className="divide-y divide-border">
        {shortcuts.map(shortcut => (
          <div key={shortcut.key} className="flex items-center justify-between gap-4 py-3">
            <Kbd>{shortcut.key}</Kbd>
            <span className="text-fg-3 text-sm">{shortcut.description}</span>
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
