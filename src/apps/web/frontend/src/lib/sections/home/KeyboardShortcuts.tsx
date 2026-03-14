import { motion } from 'framer-motion'
import Modal from '$components/Modal'
import type { KeyboardShortcutsProps } from '$types/sections/home'

const shortcuts = [
  { key: 'Ctrl + K', description: 'Focus input field' },
  { key: 'Esc', description: 'Clear input' },
  { key: 'Enter', description: 'Send message' },
  { key: '?', description: 'Toggle this panel' },
  { key: 'Ctrl + /', description: 'Open shortcuts help' },
]

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="md"
      animationEnabled={true}
    >
      <div className="space-y-3">
        {shortcuts.map((shortcut, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-surface transition-all duration-200"
          >
            <kbd className="px-3 py-1.5 rounded-lg text-sm font-mono bg-surface border border-border text-text">
              {shortcut.key}
            </kbd>
            <span className="text-textSecondary text-sm">{shortcut.description}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg font-medium transition-all duration-200 hover:bg-surface text-text"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}
