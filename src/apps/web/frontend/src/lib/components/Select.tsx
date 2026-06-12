import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface SelectOption {
  label: string
  value: string
  icon?: string
}

export interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Custom dropdown select with glass overlay and aurora focus ring.
 */
export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => o.value === value)

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 px-3 py-[7px] bg-[var(--bg-surface-2)] border border-[var(--border-2)] rounded-md text-[var(--fg-1)] text-[13px] w-[240px] cursor-pointer outline-none transition-all duration-base focus-visible:border-[var(--aurora-400)] focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--primary)_18%,transparent)] disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {selectedOption?.icon && (
          <span className="material-symbols-outlined text-[16px] text-[var(--aurora-300)]">
            {selectedOption.icon}
          </span>
        )}
        <span className="font-mono text-[var(--aurora-300)] truncate">
          {selectedOption ? (
            selectedOption.label
          ) : (
            <span className="text-[var(--fg-4)]">{placeholder}</span>
          )}
        </span>
        <span className="material-symbols-outlined ml-auto text-[18px] text-[var(--fg-3)]">
          expand_more
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 mt-1.5 w-full bg-[var(--bg-glass)] border border-[var(--border-2)] rounded-md shadow-knik-3 overflow-hidden z-50 backdrop-blur-xl"
          >
            <div className="max-h-[240px] overflow-y-auto knik-scrollbar py-1">
              {options.map(option => (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 text-[13px] cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-surface-3)] ${
                    value === option.value ? 'bg-[var(--bg-surface-3)]' : ''
                  }`}
                >
                  {option.icon && (
                    <span className="material-symbols-outlined text-[16px] text-[var(--aurora-300)]">
                      {option.icon}
                    </span>
                  )}
                  <span
                    className={`font-mono ${
                      value === option.value ? 'text-[var(--aurora-300)]' : 'text-[var(--fg-2)]'
                    }`}
                  >
                    {option.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
