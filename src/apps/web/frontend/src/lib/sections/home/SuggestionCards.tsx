import { motion } from 'framer-motion'
import { Code, EditNote, BugReport, Description } from '@mui/icons-material'

const suggestions = [
  {
    icon: <Code />,
    title: 'Refactor my Python script',
    subtitle: 'Optimize performance and readability',
  },
  {
    icon: <EditNote />,
    title: 'Write a blog post outline',
    subtitle: 'On future of AI in healthcare',
  },
  {
    icon: <BugReport />,
    title: 'Debug my React component',
    subtitle: 'Fix state management issues',
  },
  { icon: <Description />, title: 'Create API documentation', subtitle: 'For REST endpoints' },
]

import type { SuggestionCardsProps } from '$types/sections/home'

export default function SuggestionCards({ onSelectPrompt }: SuggestionCardsProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.5,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
      },
    },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto"
    >
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={index}
          variants={item}
          whileHover={{
            scale: 1.05,
            y: -5,
            transition: { type: 'spring', stiffness: 400, damping: 20 },
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectPrompt(suggestion.title)}
          className="relative overflow-hidden rounded-xl p-5 cursor-pointer bg-surface border border-border transition-all duration-300 hover:border-primary hover:shadow-xl"
          style={{
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-primary)', opacity: 0.1 }}
            >
              <div style={{ color: 'var(--color-primary)' }}>{suggestion.icon}</div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold mb-1 truncate">{suggestion.title}</h3>
              <p className="text-textSecondary text-sm line-clamp-2">{suggestion.subtitle}</p>
            </div>
          </div>

          <motion.div
            className="absolute inset-0 rounded-xl"
            initial={false}
            whileHover={{
              boxShadow: `0 0 20px -5px var(--color-primary)`,
            }}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
