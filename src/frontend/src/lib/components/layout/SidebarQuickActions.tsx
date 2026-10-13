import Button from '$components/buttons/Button'
import { MS } from '$components'
import type { SidebarQuickActionsProps } from '$types/widgets/chat-shell'

export default function SidebarQuickActions({ collapsed, onNewChat }: SidebarQuickActionsProps) {
  return (
    <div className="mb-4">
      <Button
        variant="secondary"
        onClick={onNewChat}
        aria-label="New Chat"
        title={collapsed ? 'New Chat' : undefined}
        className={`w-full rounded-[11px] ${collapsed ? 'justify-center px-0' : 'justify-start px-2.5'}`}
        icon={<MS name="add" size={18} />}
      >
        {!collapsed && 'New chat'}
      </Button>
    </div>
  )
}
