import Button from '$components/buttons/Button'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AccordionProps } from '$types'

export default function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className = '',
}: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(defaultOpen))

  const toggleItem = (id: string) => {
    setOpenIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        if (!allowMultiple) {
          newSet.clear()
        }
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map(item => {
        const isOpen = openIds.has(item.id)
        return (
          <div key={item.id} className="knik-card overflow-hidden">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_50%,transparent)]"
              onClick={() => toggleItem(item.id)}
              aria-expanded={isOpen}
            >
              <span className="font-medium text-fg-1">{item.title}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="material-symbols-outlined text-fg-3"
                aria-hidden="true"
              >
                expand_more
              </motion.span>
            </Button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 pt-0 text-fg-2 border-t border-[color-mix(in_srgb,var(--border-2)_50%,transparent)]">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
