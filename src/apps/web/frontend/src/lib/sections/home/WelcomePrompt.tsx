import { motion } from 'framer-motion'
import { AutoAwesome } from '@mui/icons-material'

export default function WelcomePrompt() {
  return (
    <div className="text-center mb-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.8,
          ease: 'easeOut',
          delay: 0.1,
        }}
        className="mb-6 flex justify-center"
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-primaryHover"
          style={{
            boxShadow: '0 20px 40px -10px var(--color-primary)',
          }}
        >
          <AutoAwesome
            style={{
              fontSize: 48,
              color: 'white',
            }}
          />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: 'easeOut',
          delay: 0.3,
        }}
        className="text-4xl font-bold text-white mb-4"
      >
        How can I help you today?
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: 'easeOut',
          delay: 0.4,
        }}
        className="text-textSecondary text-lg max-w-2xl mx-auto"
      >
        Knik AI can assist with coding, content generation, and complex workflows.
      </motion.p>
    </div>
  )
}
