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
      {avatar && <div className="shrink-0">{avatar}</div>}
      <div className={isUser ? 'max-w-[78%] min-w-0' : 'flex-1 min-w-0'}>
        {header}
        {reasoning && <div className="mb-3">{reasoning}</div>}
        <div
          // Typed line breaks survive inside paragraphs only; the newlines markdown leaves between
          // blocks would otherwise render as blank lines.
          className={
            isUser
              ? 'px-[15px] py-[11px] rounded-[18px_18px_6px_18px] bg-panel-2 border border-border-1 text-body-lg leading-[1.6] text-fg-1 [text-wrap:pretty] [&_p]:whitespace-pre-wrap [&_p]:leading-[1.6]'
              : 'text-body-lg leading-[1.65] text-fg-1 [text-wrap:pretty]'
          }
        >
          {content}
        </div>
        {!isUser && onCopy && (
          <div className="flex gap-1 mt-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={onCopy}
              aria-label="Copy message"
              className="knik-btn--icon knik-btn--compact w-[30px] h-[30px] rounded-[9px] text-fg-4"
            >
              <MS name="content_copy" size={15} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
