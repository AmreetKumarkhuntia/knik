import { forwardRef, useImperativeHandle, useRef, useEffect, useCallback, useState } from 'react'
import MS from '$components/MS'
import Kbd from '$components/Kbd'
import ActionIcon from '$components/ActionIcon'
import ModelPicker from '$components/ModelPicker'
import type { InputPanelProps, InputPanelRef } from '$types/sections/chat'

/** Chat composer: glass field with model picker, attach/voice, send, and a hint row. */
const InputPanel = forwardRef<InputPanelRef, InputPanelProps>(
  ({ value, onChange, onSend, disabled, model, onModel }, ref) => {
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !disabled) {
        e.preventDefault()
        if (value.trim()) onSend()
      }
    }

    const canSend = !!value.trim() && !disabled

    return (
      <div>
        <div
          style={{
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            border: `1px solid ${focused ? 'var(--acc-border, rgba(0,217,244,0.45))' : 'var(--border-2)'}`,
            borderRadius: 'var(--r-card, 14px)',
            padding: '12px 12px 10px 14px',
            transition: 'all 200ms var(--ease-out)',
            boxShadow: focused ? '0 0 0 3px var(--acc-soft)' : 'var(--shadow-1)',
          }}
        >
          <textarea
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
              fontSize: 14.5,
              lineHeight: 1.5,
              padding: '4px 0',
            }}
          />

          <div className="flex items-center" style={{ gap: 6 }}>
            {model && onModel && <ModelPicker model={model} onChange={onModel} compact />}
            <ActionIcon title="Attach" icon={<MS name="attach_file" size={18} />} />
            <ActionIcon title="Voice" icon={<MS name="mic" size={18} />} />
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => canSend && onSend()}
              disabled={!canSend}
              aria-label="Send message"
              className="inline-flex items-center justify-center transition-all duration-200 ease-knik-out"
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--r-btn, 10px)',
                background: 'var(--acc, var(--aurora-400))',
                color: 'var(--on-primary)',
                border: 'none',
                cursor: canSend ? 'pointer' : 'not-allowed',
                boxShadow: canSend
                  ? '0 6px 22px -6px var(--acc-glow, rgba(0,217,244,0.65)), 0 1px 0 rgba(255,255,255,0.2) inset'
                  : 'none',
                opacity: canSend ? 1 : 0.4,
              }}
            >
              <MS name="arrow_upward" size={20} weight={500} />
            </button>
          </div>
        </div>
        <div
          className="font-mono"
          style={{ marginTop: 8, paddingInline: 4, fontSize: 10.5, color: 'var(--fg-5)' }}
        >
          <Kbd>⌘</Kbd> <Kbd>K</Kbd> command · <Kbd>Enter</Kbd> send · <Kbd>⇧ Enter</Kbd> newline
        </div>
      </div>
    )
  }
)

InputPanel.displayName = 'InputPanel'

export default InputPanel
