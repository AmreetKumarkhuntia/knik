import Button from '$components/buttons/Button'
import { MS } from '$components'
import { UI_TEXT } from '$lib/constants'
import type { SidebarQuickActionsProps } from '$types/widgets/chat-shell'

export default function SidebarQuickActions({ collapsed, onNewChat }: SidebarQuickActionsProps) {
  return (
    <div className="mb-4">
      <Button
        variant="secondary"
        onClick={onNewChat}
        aria-label={UI_TEXT.nav.newChat}
        title={collapsed ? UI_TEXT.nav.newChat : undefined}
        className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start'}`}
        icon={<MS name="add" size={18} />}
      >
        {!collapsed && 'New chat'}
      </Button>
    </div>
  )
}
