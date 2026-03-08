import { motion, AnimatePresence } from 'framer-motion'
import { Close } from '@mui/icons-material'
import Backdrop from '$components/Backdrop'

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

const shortcuts = [
  { key: 'Ctrl + K', description: 'Focus input field' },
  { key: 'Esc', description: 'Clear input' },
  { key: 'Enter', description: 'Send message' },
  { key: '?', description: 'Toggle this panel' },
  { key: 'Ctrl + /', description: 'Open shortcuts help' },
]

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Backdrop visible={isOpen} onClick={onClose} blur="md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-surfaceGlass backdrop-blur-xl rounded-2xl border border-borderLight shadow-2xl max-w-md w-full mx-4 pointer-events-auto"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-text">Keyboard Shortcuts</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-textSecondary hover:text-text hover:bg-white/10 transition-all duration-200"
                    aria-label="Close shortcuts"
                  >
                    <Close />
                  </button>
                </div>

                <div className="space-y-3">
                  {shortcuts.map((shortcut, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-200"
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
                    className="w-full py-3 rounded-lg font-medium transition-all duration-200 hover:bg-white/10 text-text"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
