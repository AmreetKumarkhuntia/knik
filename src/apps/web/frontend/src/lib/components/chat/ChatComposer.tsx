import { forwardRef, useImperativeHandle, useRef, useEffect, useCallback, useState } from 'react'
import { MS, Kbd, ModelPicker } from '$components'
import Button from '../buttons/Button'
import Textarea from '../forms/Textarea'
import type { InputPanelProps, InputPanelRef } from '$types/sections/chat'

const ChatComposer = forwardRef<InputPanelRef, InputPanelProps>(
  (
    {
      value,
      onChange,
      onSend,
      disabled,
      isStreaming,
      onStop,
      model,
      onModel,
      models,
      onOpenTools,
      toolsOpen,
    },
    ref
  ) => {
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

    const canSend = !!value.trim() && !disabled && !isStreaming

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
      e.preventDefault()
      if (canSend) onSend()
    }

    return (
      <div>
        <div
          className={`relative bg-panel-2 backdrop-blur-[22px] border rounded-[20px] pt-3 pr-3 pb-2.5 pl-3.5 transition-[border-color,box-shadow,transform] duration-slow ease-spring ${
            focused
              ? 'border-[var(--acc-border)] shadow-[0_0_0_4px_var(--acc-soft),0_24px_50px_-30px_var(--acc-glow)] -translate-y-0.5'
              : 'border-border-2 shadow-knik-2'
          }`}
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
            className="block w-full resize-none outline-none border-none bg-transparent font-sans text-body-lg leading-[1.6] text-fg-1"
            // The wrapper carries the focus treatment, so the field drops knik-input's own ring.
            style={{
              minHeight: 26,
              maxHeight: 200,
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
                className="knik-btn--compact h-8 px-2.5 rounded-[9px] hover:!bg-panel-3"
              >
                Tools
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex knik-btn--icon knik-btn--compact w-8 h-8 rounded-[9px] text-fg-4"
              disabled
              aria-label="Attach file"
              title="Attachments are unavailable in this frontend session"
            >
              <MS name="attach_file" size={18} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex knik-btn--icon knik-btn--compact w-8 h-8 rounded-[9px] text-fg-4"
              disabled
              aria-label="Voice input"
              title="Voice input is unavailable in this frontend session"
            >
              <MS name="mic" size={18} />
            </Button>
            {isStreaming ? (
              <Button
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                variant="primary"
                size="sm"
                className="knik-btn--icon knik-enter-pop ml-auto w-9 h-9 rounded-[12px] bg-fg-1 text-[var(--bg-base)] shadow-none hover:!bg-fg-1 hover:!scale-[1.06] active:!scale-[.94]"
              >
                <MS name="stop" size={18} fill={1} />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => canSend && onSend()}
                disabled={!canSend}
                aria-label="Send message"
                variant="primary"
                size="sm"
                className="knik-btn--icon ml-auto w-9 h-9 rounded-[12px] shadow-[0_10px_24px_-12px_var(--acc-glow)] enabled:hover:!-translate-y-px enabled:hover:!scale-[1.04] enabled:active:!scale-[.94]"
              >
                <MS name="arrow_upward" size={20} weight={500} />
              </Button>
            )}
          </div>
        </div>
        <div className="hidden sm:flex mt-2 px-1 flex-wrap items-center gap-1.5 text-micro font-normal text-fg-4">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
          <span>command</span>
          <span className="text-[var(--border-strong)]">·</span>
          <Kbd>Enter</Kbd>
          <span>send</span>
          <span className="text-[var(--border-strong)]">·</span>
          <Kbd>⇧ Enter</Kbd>
          <span>newline</span>
        </div>
      </div>
    )
  }
)

ChatComposer.displayName = 'ChatComposer'

export default ChatComposer
