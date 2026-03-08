import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Close } from '@mui/icons-material'
import Backdrop from '$components/Backdrop'
import { useTheme } from '$hooks/useTheme'

interface ThemeSelectorProps {
  isOpen: boolean
  onClose: () => void
}

const accentColors = [
  { name: 'purple' as const, label: 'Purple', color: '#8B5CF6' },
  { name: 'blue' as const, label: 'Blue', color: '#3B82F6' },
  { name: 'teal' as const, label: 'Teal', color: '#14B8A6' },
]

export default function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const { mode, accentName, setMode, setAccent } = useTheme()

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
              className="bg-surfaceGlass backdrop-blur-xl rounded-2xl border border-borderLight shadow-2xl max-w-lg w-full mx-4 pointer-events-auto"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-text">Theme Settings</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-textSecondary hover:text-text hover:bg-white/10 transition-all duration-200"
                    aria-label="Close theme selector"
                  >
                    <Close />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-text mb-3">Color Mode</h3>
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMode('dark')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                          mode === 'dark'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-borderLight'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center">
                            <span className="text-2xl">🌙</span>
                          </div>
                          <span className="text-sm font-medium text-text">Dark</span>
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMode('light')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                          mode === 'light'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-borderLight'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center">
                            <span className="text-2xl">☀️</span>
                          </div>
                          <span className="text-sm font-medium text-text">Light</span>
                        </div>
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-text mb-3">Accent Color</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {accentColors.map(accent => (
                        <motion.button
                          key={accent.name}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setAccent(accent.name)}
                          className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                            accentName === accent.name
                              ? 'border-primary'
                              : 'border-border hover:border-borderLight'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: accent.color }}
                            >
                              {accentName === accent.name && (
                                <CheckCircle style={{ color: 'white', fontSize: 24 }} />
                              )}
                            </div>
                            <span className="text-sm font-medium text-text">{accent.label}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-text mb-3">Preview</h3>
                    <div
                      className="p-4 rounded-xl border-2 border-border"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-primary)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                          <span className="text-white text-lg">✨</span>
                        </div>
                        <div className="flex-1">
                          <div
                            className="text-sm font-medium"
                            style={{ color: 'var(--color-text)' }}
                          >
                            Preview Text
                          </div>
                          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            This is how your theme will look
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="w-full py-3 rounded-lg font-medium transition-all duration-200 text-white"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      boxShadow: '0 4px 15px -3px var(--color-primary)',
                    }}
                  >
                    Apply Theme
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
