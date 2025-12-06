/**
 * InputPanel Component
 * Text input with send button and keyboard shortcuts
 */

import { forwardRef, useImperativeHandle, useRef } from 'react'

interface InputPanelProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}

export interface InputPanelRef {
  focus: () => void
  clear: () => void
}

const InputPanel = forwardRef<InputPanelRef, InputPanelProps>(
  ({ value, onChange, onSend, disabled }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => onChange(''),
    }))
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !disabled) {
        e.preventDefault()
        onSend()
      }
    }

    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 shadow-2xl border border-white/10">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Ctrl+K to focus, Esc to clear)"
          disabled={disabled}
          className="w-full bg-white/10 text-white placeholder-white/40 px-6 py-4 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-white/20 border border-white/10
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200"
        />
      </div>
    )
  }
)

InputPanel.displayName = 'InputPanel'

export default InputPanel
