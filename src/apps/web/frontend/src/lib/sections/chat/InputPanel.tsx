import { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AttachFile, Mic, Send as SendIcon } from '@mui/icons-material'
import type { InputPanelProps, InputPanelRef } from '$types/sections/chat'

/** Chat input bar with send, attach, and voice action buttons. */
const InputPanel = forwardRef<InputPanelRef, InputPanelProps>(
  ({ value, onChange, onSend, disabled }, ref) => {
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const autoResize = useCallback(() => {
      const el = inputRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }, [])

    useEffect(() => {
      autoResize()
    }, [value, autoResize])

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => onChange(''),
    }))

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !disabled) {
        e.preventDefault()
        onSend()
      }
    }

    return (
      <div className="bg-surfaceGlass backdrop-blur-lg rounded-xl p-3" style={{}}>
        <div className="flex flex-col gap-2">
          <textarea
            ref={inputRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-text placeholder-textSecondary outline-none border-none text-base focus:ring-0 resize-none overflow-hidden px-3 py-2.5 leading-relaxed"
            style={{ maxHeight: '200px', transition: 'height 0.15s ease' }}
          />

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-textSecondary hover:text-text transition-colors duration-200"
              aria-label="Attach file"
              disabled={disabled}
            >
              <AttachFile />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-textSecondary hover:text-text transition-colors duration-200"
              aria-label="Voice input"
              disabled={disabled}
            >
              <Mic />
            </motion.button>

            <div className="flex-1" />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSend}
              disabled={disabled || !value.trim()}
              className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                !value.trim() || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              style={{
                backgroundColor: 'var(--color-primary)',
                boxShadow:
                  value.trim() && !disabled ? '0 4px 15px -3px var(--color-primary)' : 'none',
              }}
              aria-label="Send message"
            >
              <SendIcon style={{ color: 'var(--color-text-inverse)', fontSize: 20 }} />
            </motion.button>
          </div>
        </div>
      </div>
    )
  }
)

InputPanel.displayName = 'InputPanel'

export default InputPanel
