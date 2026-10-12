import Button from '../buttons/Button'
import MS from '../display/MS'
import type { ChatBubbleProps } from '$types/components/chat'

export default function ChatBubble({
  role,
  content,
  onCopy,
  avatar,
  header,
  reasoning,
}: ChatBubbleProps) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-[13px] ${isUser ? 'flex-row-reverse' : ''}`}>
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
        {!isUser && onCopy && (
          <div className="flex gap-1 mt-2">
            <Button variant="ghost" size="xs" onClick={onCopy} aria-label="Copy message">
              <MS name="content_copy" size={15} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
