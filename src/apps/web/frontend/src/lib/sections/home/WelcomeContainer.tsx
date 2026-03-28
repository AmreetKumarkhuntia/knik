import { AnimatePresence, motion } from 'framer-motion'
import type { WelcomeContainerProps } from '$types/sections/home'

/** Animated wrapper that fades in/out the welcome content. */
export default function WelcomeContainer({ isVisible, children }: WelcomeContainerProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut',
          }}
          className="flex-1 flex flex-col items-center justify-center px-6"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
