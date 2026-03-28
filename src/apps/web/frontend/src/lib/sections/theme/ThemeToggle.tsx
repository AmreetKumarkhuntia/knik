import { motion } from 'framer-motion'
import { WbSunny, DarkMode } from '@mui/icons-material'
import { useTheme } from '$hooks/useTheme'

/** Animated toggle switch between light and dark mode. */
export default function ThemeToggle() {
  const { mode, setMode } = useTheme()
  const isDark = mode === 'dark'

  return (
    <motion.button
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      className="relative w-12 h-6 rounded-full transition-colors duration-300"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: 'var(--color-text)',
        }}
        initial={false}
        animate={{
          left: isDark ? '4px' : '28px',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isDark ? (
          <DarkMode style={{ fontSize: 12, color: 'var(--color-surface)' }} />
        ) : (
          <WbSunny style={{ fontSize: 12, color: 'var(--color-surface)' }} />
        )}
      </motion.div>
    </motion.button>
  )
}
