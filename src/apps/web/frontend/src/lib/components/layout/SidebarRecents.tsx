import Button from '$components/buttons/Button'
import { LoadingSpinner, EmptyState, MS } from '$components'
import Eyebrow from '$components/display/Eyebrow'
import { formatRelativeDay } from '$utils/format'
import { UI_TEXT, EMPTY_STATE_DEFAULTS } from '$lib/constants'
import type { Conversation } from '$types/conversation'
import type { SidebarRecentsProps } from '$types/widgets/chat-shell'

function getConversationLabel(conv: Conversation): string {
  return conv.title || 'New chat'
}

/** Recent conversations list with hover rename/delete actions. */
export default function SidebarRecents({
  conversations,
  loading,
  onSelect,
  onRename,
  onDelete,
  activeConversationId,
}: SidebarRecentsProps) {
  return (
    <div className="flex flex-col min-h-0 flex-1" style={{ marginTop: 24 }}>
      <Eyebrow>Recent chats</Eyebrow>
      <div className="overflow-y-auto flex flex-col scrollbar-hide" style={{ gap: 1 }}>
        {loading ? (
          <LoadingSpinner size="sm" className="py-8" />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={EMPTY_STATE_DEFAULTS.icon}
            title={UI_TEXT.empty.noHistoryTitle}
            description={UI_TEXT.empty.noHistoryDescription}
          />
        ) : (
          conversations.map(conv => {
            const label = getConversationLabel(conv)
            const current = conv.id === activeConversationId
            const restingBackground = current ? 'var(--acc-soft)' : 'transparent'
            return (
              <div
                key={conv.id}
                className="group relative transition-colors min-h-12 sm:min-h-9 [@media(pointer:coarse)]:min-h-12"
                style={{ borderRadius: 'var(--r-btn)', background: restingBackground }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-3)')}
                onMouseLeave={e => (e.currentTarget.style.background = restingBackground)}
              >
                <Button
                  type="button"
                  aria-current={current ? 'true' : undefined}
                  onClick={() => onSelect(conv.id)}
                  className="w-full text-left pr-[100px] sm:pr-2 sm:group-hover:pr-20 sm:group-focus-within:pr-20 [@media(pointer:coarse)]:pr-[100px]"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    paddingBlock: '8px',
                    paddingLeft: '8px',
                    display: 'block',
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-center" style={{ gap: 6 }}>
                    <span
                      className="truncate flex-1"
                      style={{
                        fontSize: 13,
                        fontWeight: current ? 500 : 400,
                        color: current ? 'var(--acc-text)' : 'var(--fg-2)',
                      }}
                    >
                      {label}
                    </span>
                    <span
                      className="hidden sm:block font-mono flex-shrink-0 transition-opacity group-hover:opacity-0 group-focus-within:opacity-0"
                      style={{ fontSize: 11, color: 'var(--fg-3)' }}
                    >
                      {formatRelativeDay(conv.updated_at)}
                    </span>
                  </div>
                </Button>
                <div
                  className="absolute flex items-center opacity-100 sm:opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(pointer:coarse)]:opacity-100"
                  style={{ top: 0, bottom: 0, right: 2, gap: 2 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ width: 36, height: 36, padding: 0 }}
                    icon={<MS name="edit" size={13} />}
                    title="Rename"
                    aria-label={`Rename conversation ${label}`}
                    onClick={() => onRename(conv)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ width: 36, height: 36, padding: 0 }}
                    icon={<MS name="delete" size={13} />}
                    title="Delete"
                    aria-label={`Delete conversation ${label}`}
                    onClick={() => onDelete(conv)}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
