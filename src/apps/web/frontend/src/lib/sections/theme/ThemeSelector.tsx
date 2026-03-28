import { motion } from 'framer-motion'
import { CheckCircle, DarkMode, LightMode, Star } from '@mui/icons-material'
import Modal from '$components/Modal'
import { useTheme } from '$hooks/useTheme'
import { themePresets } from '$lib/constants/themes'
import type { ThemeSelectorProps } from '$types/theme'

const accentColors = [
  { name: 'purple' as const, label: 'Purple', color: themePresets.purple.primary },
  { name: 'blue' as const, label: 'Blue', color: themePresets.blue.primary },
  { name: 'teal' as const, label: 'Teal', color: themePresets.teal.primary },
]

/** Modal for selecting color mode and accent color with live preview. */
export default function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const { mode, accentName, setMode, setAccent } = useTheme()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Theme Settings"
      size="lg"
      animationEnabled={true}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Color Mode</h3>
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
                  <DarkMode />
                </div>
                <span className="text-sm font-medium text-foreground">Dark</span>
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
                  <LightMode />
                </div>
                <span className="text-sm font-medium text-foreground">Light</span>
              </div>
            </motion.button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Accent Color</h3>
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
                      <CheckCircle style={{ color: 'var(--color-text-inverse)', fontSize: 24 }} />
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">{accent.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Preview</h3>
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
                <Star style={{ color: 'var(--color-text-inverse)', fontSize: 20 }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
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
          className="w-full py-3 rounded-lg font-medium transition-all duration-200 text-inverse"
          style={{
            backgroundColor: 'var(--color-primary)',
            boxShadow: '0 4px 15px -3px var(--color-primary)',
          }}
        >
          Apply Theme
        </motion.button>
      </div>
    </Modal>
  )
}
