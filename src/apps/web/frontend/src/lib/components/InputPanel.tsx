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
      <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-5 shadow-2xl border border-white/10">
        <div className="flex gap-4">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Ctrl+K to focus, Esc to clear)"
            disabled={disabled}
            className="flex-1 bg-white/10 text-white placeholder-white/40 px-6 py-4 rounded-2xl 
                     focus:outline-none focus:ring-2 focus:ring-teal-400/50 border border-white/10
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200"
          />
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 
                     disabled:from-gray-600 disabled:to-gray-500
                     text-white px-10 py-4 rounded-2xl font-semibold 
                     transition-all duration-200 
                     disabled:cursor-not-allowed disabled:opacity-50
                     shadow-xl hover:shadow-2xl active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    )
  }
)

InputPanel.displayName = 'InputPanel'

export default InputPanel
