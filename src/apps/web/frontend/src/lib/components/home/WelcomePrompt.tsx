import { motion } from 'framer-motion'
import { KnikGlyph } from '$components'
import { ANIMATION } from '$lib/constants'

/** Animated welcome heading with the KNIK glyph and accent-gradient title. */
export default function WelcomePrompt() {
  return (
    <div className="text-center" style={{ marginBottom: 30, maxWidth: 720 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: ANIMATION.longDuration / 1000, ease: 'easeOut', delay: 0.1 }}
        className="mx-auto flex items-center justify-center"
        style={{
          width: 60,
          height: 60,
          marginBottom: 20,
          borderRadius: 16,
          background: 'rgba(11,18,26,0.7)',
          border: '1.5px solid var(--acc-border, rgba(0,217,244,0.45))',
          boxShadow: '0 0 40px -6px var(--acc-glow, rgba(0,217,244,0.55))',
        }}
      >
        <KnikGlyph size={32} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: ANIMATION.yOffset }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ANIMATION.mediumDuration / 1000, ease: 'easeOut', delay: 0.3 }}
        className="font-display"
        style={{
          fontSize: 'clamp(34px,5vw,46px)',
          fontWeight: 600,
          letterSpacing: '-0.035em',
          lineHeight: 1.05,
          color: 'var(--fg-1)',
          margin: 0,
        }}
      >
        How can I help you{' '}
        <span
          style={{
            background:
              'linear-gradient(135deg, var(--acc-text, var(--aurora-300)), var(--teal-400))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          today?
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: ANIMATION.yOffset }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ANIMATION.mediumDuration / 1000, ease: 'easeOut', delay: 0.4 }}
        style={{
          marginTop: 13,
          fontSize: 16,
          color: 'var(--fg-3)',
          maxWidth: 520,
          marginInline: 'auto',
        }}
      >
        Knik AI can assist with coding, content generation, and complex workflows.
      </motion.p>
    </div>
  )
}
