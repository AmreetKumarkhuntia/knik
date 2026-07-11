import { ActionIcon, LoadingSpinner, EmptyState, MS } from '$components'
import { Eyebrow } from '$widgets'
import { formatRelativeDay } from '$utils/format'
import { UI_TEXT, EMPTY_STATE_DEFAULTS } from '$lib/constants'
import type { Conversation } from '$types/api'
import type { SidebarRecentsProps } from '$types/sections/layout'

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
}: SidebarRecentsProps) {
  return (
    <div className="flex flex-col min-h-0 flex-1" style={{ marginTop: 18 }}>
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
          conversations.map(conv => (
            <div
              key={conv.id}
              className="group relative transition-colors"
              style={{ borderRadius: 'var(--r-btn, 8px)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <button
                type="button"
                onClick={() => onSelect(conv.id)}
                className="w-full text-left"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '7px 11px',
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center" style={{ gap: 6 }}>
                  <span
                    className="truncate flex-1"
                    style={{ fontSize: 12.5, fontWeight: 550, color: 'var(--fg-2)' }}
                  >
                    {getConversationLabel(conv)}
                  </span>
                  <span
                    className="font-mono flex-shrink-0 transition-opacity group-hover:opacity-0"
                    style={{ fontSize: 10, color: 'var(--fg-5)' }}
                  >
                    {formatRelativeDay(conv.updated_at)}
                  </span>
                </div>
                {conv.preview && (
                  <div
                    className="truncate"
                    style={{ fontSize: 11.5, color: 'var(--fg-4)', marginTop: 1 }}
                  >
                    {conv.preview}
                  </div>
                )}
              </button>
              <div
                className="absolute flex items-center opacity-0 transition-opacity group-hover:opacity-100"
                style={{ top: 4, right: 6, gap: 2 }}
              >
                <ActionIcon
                  size={26}
                  icon={<MS name="edit" size={13} />}
                  title="Rename"
                  onClick={() => onRename(conv)}
                />
                <ActionIcon
                  size={26}
                  icon={<MS name="delete" size={13} />}
                  title="Delete"
                  danger
                  onClick={() => onDelete(conv)}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
