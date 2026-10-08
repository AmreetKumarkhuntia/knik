import { forwardRef, useImperativeHandle, useRef, useEffect, useCallback, useState } from 'react'
import { MS, Kbd, ModelPicker } from '$components'
import Button from '../buttons/Button'
import Textarea from '../forms/Textarea'
import type { InputPanelProps, InputPanelRef } from '$types/sections/chat'

const ChatComposer = forwardRef<InputPanelRef, InputPanelProps>(
  ({ value, onChange, onSend, disabled, model, onModel, models, onOpenTools, toolsOpen }, ref) => {
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const [focused, setFocused] = useState(false)

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

    const canSend = !!value.trim() && !disabled

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
      e.preventDefault()
      if (canSend) onSend()
    }

    return (
      <div>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${focused ? 'var(--acc)' : 'var(--border-2)'}`,
            borderRadius: 12,
            padding: '12px 12px 10px 14px',
            transition: 'border-color 120ms ease-out',
          }}
        >
          <Textarea
            aria-label="Message"
            ref={inputRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Type your message…  (Shift+Enter for new line)"
            disabled={disabled}
            rows={1}
            className="w-full resize-none outline-none border-none bg-transparent font-sans"
            style={{
              minHeight: 26,
              maxHeight: 200,
              color: 'var(--fg-1)',
              fontSize: 16,
              lineHeight: 1.5,
              padding: '4px 0',
              boxShadow: 'none',
              outline: 'none',
              border: 0,
              background: 'transparent',
            }}
          />

          <div className="flex items-center flex-wrap gap-1 mt-2">
            {model && onModel && models && models.length > 0 && (
              <ModelPicker model={model} onChange={onModel} models={models} compact />
            )}
            {onOpenTools && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenTools}
                aria-expanded={toolsOpen}
                aria-haspopup="dialog"
                icon={<MS name="tune" size={18} />}
              >
                Tools
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              disabled
              aria-label="Attach file"
              title="Attachments are unavailable in this frontend session"
            >
              <MS name="attach_file" size={18} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              disabled
              aria-label="Voice input"
              title="Voice input is unavailable in this frontend session"
            >
              <MS name="mic" size={18} />
            </Button>
            <Button
              type="button"
              onClick={() => canSend && onSend()}
              disabled={!canSend}
              aria-label="Send message"
              variant="primary"
              size="sm"
              className="shrink-0 ml-auto"
            >
              <MS name="arrow_upward" size={20} weight={500} />
            </Button>
          </div>
        </div>
        <div
          className="hidden sm:block"
          style={{ marginTop: 8, paddingInline: 4, fontSize: 11, color: 'var(--fg-3)' }}
        >
          <Kbd>⌘</Kbd> <Kbd>K</Kbd> command · <Kbd>Enter</Kbd> send · <Kbd>⇧ Enter</Kbd> newline
        </div>
      </div>
    )
  }
)

ChatComposer.displayName = 'ChatComposer'

export default ChatComposer
