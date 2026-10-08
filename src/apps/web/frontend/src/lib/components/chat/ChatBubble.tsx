import Button from '../buttons/Button'
import MS from '../display/MS'
import type { ChatBubbleProps } from '$types/components/chat'

export default function ChatBubble({
  role,
  content,
  timestamp,
  actions,
  avatar,
  header,
  reasoning,
  actionContent,
  className = '',
}: ChatBubbleProps) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-[13px] ${isUser ? 'flex-row-reverse' : ''} ${className}`}>
      {avatar && <div className="flex-shrink-0">{avatar}</div>}
      <div style={{ maxWidth: isUser ? '78%' : '100%', flex: isUser ? 'none' : 1, minWidth: 0 }}>
        {header}
        {reasoning && <div className="mb-3">{reasoning}</div>}
        <div
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: 'var(--fg-1)',
            background: isUser ? 'var(--bg-surface-2)' : 'transparent',
            border: 'none',
            borderRadius: isUser ? 10 : 0,
            padding: isUser ? '11px 15px' : 0,
          }}
        >
          {content}
        </div>
        {!isUser && (actions || actionContent) && (
          <div className="flex gap-1 mt-2">
            {actions?.copy && (
              <Button variant="ghost" size="xs" onClick={actions.copy} aria-label="Copy message">
                <MS name="content_copy" size={15} />
              </Button>
            )}
            {actions?.thumbsUp && (
              <Button
                variant="ghost"
                size="xs"
                onClick={actions.thumbsUp}
                aria-label="Like message"
              >
                <MS name="thumb_up" size={15} />
              </Button>
            )}
            {actions?.thumbsDown && (
              <Button
                variant="ghost"
                size="xs"
                onClick={actions.thumbsDown}
                aria-label="Dislike message"
              >
                <MS name="thumb_down" size={15} />
              </Button>
            )}
            {actions?.retry && (
              <Button
                variant="ghost"
                size="xs"
                onClick={actions.retry}
                aria-label="Regenerate response"
              >
                <MS name="refresh" size={15} />
              </Button>
            )}
            {actionContent}
          </div>
        )}
        {timestamp && <span className="text-xs text-fg-4 font-mono">{timestamp}</span>}
      </div>
    </div>
  )
}
