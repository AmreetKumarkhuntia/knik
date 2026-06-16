import { motion } from 'framer-motion'
import MS from '$components/MS'
import { DEMO_SUGGESTIONS } from '$lib/constants'
import type { SuggestionCardsProps } from '$types/sections/home'

/** Grid of clickable prompt suggestion cards with an icon tile + category tag. */
export default function SuggestionCards({ onSelectPrompt }: SuggestionCardsProps) {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.4 } },
  }
  const item = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
    },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 mx-auto w-full"
      style={{ gap: 12, maxWidth: 720 }}
    >
      {DEMO_SUGGESTIONS.map((s, index) => (
        <motion.button
          key={index}
          type="button"
          variants={item}
          whileHover={{ y: -2 }}
          onClick={() => onSelectPrompt(s.title)}
          className="flex items-start text-left transition-all duration-200 ease-knik-out"
          style={{
            gap: 13,
            cursor: 'pointer',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--r-card, 12px)',
            padding: 'var(--pad-card, 18px)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--acc-border, rgba(0,217,244,0.5))'
            e.currentTarget.style.boxShadow =
              '0 14px 32px -16px var(--acc-glow, rgba(0,217,244,0.5))'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-2)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--r-btn, 9px)',
              background: 'var(--acc-soft)',
              color: 'var(--acc-text, var(--aurora-300))',
            }}
          >
            <MS name={s.icon} size={20} />
          </div>
          <div className="min-w-0">
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--fg-1)',
                letterSpacing: '-0.012em',
              }}
            >
              {s.title}
            </span>
            <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 3 }}>{s.subtitle}</div>
            <span
              className="inline-block font-mono"
              style={{
                marginTop: 9,
                fontSize: 10,
                letterSpacing: '0.04em',
                color: 'var(--fg-4)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-1)',
                padding: '2px 7px',
                borderRadius: 5,
              }}
            >
              {s.tag}
            </span>
          </div>
        </motion.button>
      ))}
    </motion.div>
  )
}
