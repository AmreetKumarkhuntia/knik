import { motion } from 'framer-motion'
import { AutoAwesome } from '@mui/icons-material'
import { UI_TEXT, ANIMATION, SIZES } from '$lib/constants'

/** Animated welcome heading with app logo and description. */
export default function WelcomePrompt() {
  return (
    <div className="text-center mb-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: ANIMATION.longDuration / 1000,
          ease: 'easeOut',
          delay: 0.1,
        }}
        className="mb-6 flex justify-center"
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-primaryHover"
          style={{
            boxShadow: SIZES.boxShadow.lg,
          }}
        >
          <AutoAwesome
            style={{
              fontSize: SIZES.icon.xl,
              color: 'var(--color-text-inverse)',
            }}
          />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: ANIMATION.yOffset }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: ANIMATION.mediumDuration / 1000,
          ease: 'easeOut',
          delay: 0.3,
        }}
        className="text-4xl font-bold text-foreground mb-4"
      >
        {UI_TEXT.welcome.title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: ANIMATION.yOffset }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: ANIMATION.mediumDuration / 1000,
          ease: 'easeOut',
          delay: 0.4,
        }}
        className="text-textSecondary text-lg max-w-2xl mx-auto"
      >
        {UI_TEXT.welcome.description}
      </motion.p>
    </div>
  )
}
