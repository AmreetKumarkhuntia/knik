/**
 * InputPanel Component
 * Text input with send button and keyboard shortcuts
 */

import { forwardRef, useImperativeHandle, useRef } from 'react'
import Input from '$components/Input'
import type { InputPanelProps, InputPanelRef } from '$types/sections/chat'

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
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-2 shadow-2xl border border-white/10">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          fullWidth={true}
          placeholder="Type your message... (Ctrl+K to focus, Esc to clear)"
          disabled={disabled}
        />
      </div>
    )
  }
)

InputPanel.displayName = 'InputPanel'

export default InputPanel
