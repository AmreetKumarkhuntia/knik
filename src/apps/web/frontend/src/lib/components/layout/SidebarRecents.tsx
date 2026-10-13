import { AnimatePresence, motion } from 'framer-motion'
import Button from '$components/buttons/Button'
import { MS } from '$components'
import Eyebrow from '$components/display/Eyebrow'
import { formatRelativeDay } from '$utils/format'
import { MOTION_DURATION, MOTION_EASE_OUT } from '$lib/constants/motion'
import type { Conversation } from '$types/conversation'
import type { SidebarRecentsProps } from '$types/widgets/chat-shell'

function getConversationLabel(conv: Conversation): string {
  return conv.title || 'New chat'
}

/** Recent conversations list with hover rename/delete actions. */
export default function SidebarRecents({
  conversations,
  onSelect,
  onRename,
  onDelete,
  activeConversationId,
}: SidebarRecentsProps) {
  return (
    <div className="flex flex-col min-h-0 flex-1 mt-6">
      <Eyebrow>Recent chats</Eyebrow>
      <div className="overflow-y-auto flex flex-col gap-px scrollbar-hide">
        {conversations.length === 0 ? (
          <div className="px-2 py-5 text-center">
            <p className="text-body-sm font-semibold text-fg-2">No history yet</p>
            <p className="mt-1 text-caption text-fg-4">Start a conversation to see it here</p>
          </div>
        ) : (
          // initial={false}: only rows added or removed later animate, not the first render.
          <AnimatePresence initial={false}>
            {conversations.map(conv => {
              const label = getConversationLabel(conv)
              const current = conv.id === activeConversationId
              return (
                <motion.div
                  key={conv.id}
                  layout="position"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: MOTION_DURATION.fast } }}
                  transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE_OUT }}
                  className={`group relative rounded-[10px] transition-colors duration-base ease-out min-h-12 sm:min-h-9 [@media(pointer:coarse)]:min-h-12 ${current ? 'bg-[var(--acc-soft)]' : 'hover:bg-panel-2'}`}
                >
                  <Button
                    variant="ghost"
                    aria-current={current ? 'true' : undefined}
                    onClick={() => onSelect(conv.id)}
                    className="w-full justify-start gap-1.5 rounded-[10px] text-left py-[7px] pl-2 pr-[100px] sm:pr-2 sm:group-hover:pr-16 sm:group-focus-within:pr-16 [@media(pointer:coarse)]:pr-[100px] hover:!bg-transparent"
                  >
                    <span
                      className={`truncate flex-1 min-w-0 text-body-sm ${current ? 'font-medium text-[var(--acc-text)]' : 'font-normal text-fg-2'}`}
                    >
                      {label}
                    </span>
                    {/* Only the 30px desktop actions leave room for the title once the date is gone; on touch
                        the faded date is what keeps the title clear of the 44px actions. */}
                    <span
                      className={`hidden sm:block shrink-0 font-mono text-micro font-normal transition-opacity group-hover:opacity-0 group-focus-within:opacity-0 [@media(min-width:768px)_and_(pointer:fine)]:group-hover:hidden [@media(min-width:768px)_and_(pointer:fine)]:group-focus-within:hidden ${current ? 'text-[var(--acc-meta)]' : 'text-fg-4'}`}
                    >
                      {formatRelativeDay(conv.updated_at)}
                    </span>
                  </Button>
                  <div className="absolute inset-y-0 right-0.5 flex items-center gap-0.5 opacity-100 sm:opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(pointer:coarse)]:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="knik-btn--icon knik-btn--compact rounded-[8px] hover:!bg-panel-3"
                      icon={<MS name="edit" size={14} />}
                      title="Rename"
                      aria-label={`Rename conversation ${label}`}
                      onClick={() => onRename(conv)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="knik-btn--icon knik-btn--compact knik-btn--destructive rounded-[8px]"
                      icon={<MS name="delete" size={14} />}
                      title="Delete"
                      aria-label={`Delete conversation ${label}`}
                      onClick={() => onDelete(conv)}
                    />
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
