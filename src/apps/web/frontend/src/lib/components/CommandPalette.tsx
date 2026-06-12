import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DEFAULT_COMMANDS } from '$constants/demoData'

export interface CommandItem {
  id: string
  label: string
  shortcut?: string
  icon?: string
}

export interface CommandGroup {
  group: string
  items: CommandItem[]
}

export interface CommandPaletteProps {
  commands?: CommandGroup[]
  onSelect: (id: string) => void
  open: boolean
  onClose: () => void
  className?: string
}

export default function CommandPalette({
  commands = DEFAULT_COMMANDS,
  onSelect,
  open,
  onClose,
  className = '',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      // Reset the query each time the palette opens.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
      if (e.key === 'k' && e.metaKey) {
        e.preventDefault()
        // Assume parent handles opening if it's closed, but we can't toggle from inside if it's controlled.
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // For a real implementation, we'd want arrow key navigation
  // Here we just use the first item from the first group as mock active state
  const mockActiveId = commands[0]?.items[0]?.id

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`
              relative w-[520px] max-w-full mx-4 bg-[var(--bg-glass)] backdrop-blur-[24px] saturate-[1.4]
              border border-[var(--border-2)] rounded-[14px] overflow-hidden shadow-knik-3
              ${className}
            `}
          >
            <div className="flex items-center gap-2.5 py-3 px-3.5 border-b border-[var(--border-2)]">
              <span className="material-symbols-outlined text-[18px] text-[var(--fg-4)]">
                search
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type a command or search…"
                className="flex-1 bg-transparent border-none outline-none text-[var(--fg-1)] font-sans text-[14px] placeholder:text-[var(--fg-4)]"
              />
              <span className="font-mono text-[10px] bg-[var(--bg-surface-3)] text-[var(--fg-3)] border border-[var(--border-2)] rounded px-1.5 py-0.5">
                esc
              </span>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {commands.map((group, gIdx) => (
                <div
                  key={group.group}
                  className={`py-2 px-1.5 ${gIdx > 0 ? 'border-t border-[var(--border-1)]' : ''}`}
                >
                  <div className="font-mono text-[10px] text-[var(--fg-5)] tracking-[0.08em] uppercase p-[4px_10px_6px]">
                    {group.group}
                  </div>

                  {group.items.map(item => {
                    const isActive = item.id === mockActiveId

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelect(item.id)
                          onClose()
                        }}
                        className={`
                          flex items-center gap-2.5 py-2 px-2.5 rounded-[7px] text-[13.5px] cursor-pointer
                          ${
                            isActive
                              ? 'bg-[var(--bg-surface-3)] text-[var(--fg-1)] shadow-[inset_0_0_0_1px_var(--border-2)]'
                              : 'text-[var(--fg-2)] hover:bg-[var(--bg-surface-3)] hover:text-[var(--fg-1)]'
                          }
                        `}
                      >
                        {item.icon && (
                          <span
                            className={`material-symbols-outlined text-[16px] ${isActive ? 'text-[var(--aurora-300)]' : 'text-[var(--fg-3)]'}`}
                          >
                            {item.icon}
                          </span>
                        )}
                        {item.label}
                        {item.shortcut && (
                          <span className="ml-auto font-mono text-[10px] bg-[var(--bg-surface-3)] text-[var(--fg-3)] border border-[var(--border-2)] rounded px-1.5 py-0.5">
                            {item.shortcut}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
