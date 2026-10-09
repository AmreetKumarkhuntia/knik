import { useLocation, useNavigate } from 'react-router-dom'
import { Modal, ConfirmDialog, Input } from '$components'
import Button from '$components/buttons/Button'
import SidebarBrand from '$components/layout/SidebarBrand'
import SidebarQuickActions from '$components/layout/SidebarQuickActions'
import SidebarNav from '$components/layout/SidebarNav'
import SidebarRecents from '$components/layout/SidebarRecents'
import SidebarAccount from '$components/layout/SidebarAccount'
import { useChatStore, useChatScope } from '$stores/chat'
import { useShellStore } from '$stores/shell'
import { useSidebarView } from '$stores/views'
import { LAYOUT } from '$lib/constants/dimensions'
import { ROUTES } from '$lib/constants/navigation'
import type { SidebarWidgetProps } from '$types/widgets/chat-shell'

export default function SidebarWidget({
  viewport = 'desktop',
  mobileOpen = false,
  onCloseMobile,
}: SidebarWidgetProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { conversations, accountName, initials } = useSidebarView()
  const activeConversationId = useChatStore(state => state.activeConversationId)
  const startConversation = useChatStore(state => state.startConversation)
  const selectConversation = useChatStore(state => state.selectConversation)
  const deleteConversation = useChatStore(state => state.deleteConversation)
  const beginRename = useChatStore(state => state.beginRename)
  const cancelRename = useChatStore(state => state.cancelRename)
  const saveRename = useChatStore(state => state.saveRename)
  const desktopCollapsed = useShellStore(state => state.collapsed)
  const collapsed = viewport === 'tablet' || (viewport === 'desktop' && desktopCollapsed)
  const setCollapsed = useShellStore(state => state.setCollapsed)
  const { scopeId, scope, patch } = useChatScope()
  const { editingId, deletingId, title, error } = scope

  const newChat = () => {
    startConversation()
    void navigate(ROUTES.home)
    onCloseMobile?.()
  }

  const closeEditor = () => cancelRename(scopeId)

  const navigation = (
    <div className="h-full min-h-0 flex flex-col" style={{ padding: collapsed ? '8px' : '12px' }}>
      <SidebarBrand
        collapsed={collapsed}
        onToggle={viewport === 'desktop' ? () => setCollapsed(!desktopCollapsed) : undefined}
      />
      <SidebarQuickActions collapsed={collapsed} onNewChat={newChat} />
      <SidebarNav collapsed={collapsed} pathname={location.pathname} onNavigate={onCloseMobile} />
      {!collapsed ? (
        <SidebarRecents
          conversations={conversations}
          loading={false}
          activeConversationId={location.pathname === ROUTES.home ? activeConversationId : null}
          onSelect={id => {
            selectConversation(id)
            void navigate(ROUTES.home)
            onCloseMobile?.()
          }}
          onRename={conversation => beginRename(scopeId, conversation)}
          onDelete={conversation => patch({ deletingId: conversation.id })}
        />
      ) : (
        <div className="flex-1" />
      )}
      <SidebarAccount
        collapsed={collapsed}
        name={accountName}
        initials={initials}
        onNavigate={onCloseMobile}
      />
    </div>
  )

  return (
    <>
      {viewport === 'mobile' ? (
        <Modal
          isOpen={mobileOpen}
          onClose={() => onCloseMobile?.()}
          title="Navigation"
          placement="left"
          size="sm"
        >
          {navigation}
        </Modal>
      ) : (
        <aside
          aria-label="Workspace sidebar"
          className="h-full flex-shrink-0 overflow-hidden bg-surface border-r border-border"
          style={{
            width: collapsed ? LAYOUT.sidebarWidth.collapsed : LAYOUT.sidebarWidth.expanded,
          }}
        >
          {navigation}
        </aside>
      )}
      <Modal
        isOpen={editingId !== null}
        onClose={closeEditor}
        title="Rename conversation"
        size="sm"
      >
        <form
          onSubmit={event => {
            event.preventDefault()
            saveRename(scopeId)
          }}
        >
          <label htmlFor="conversation-title" className="block text-sm text-fg-2 mb-2">
            Title
          </label>
          <Input
            id="conversation-title"
            value={title}
            onChange={event => {
              patch({ title: event.target.value, error: '' })
            }}
            error={error}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={closeEditor} variant="ghost">
              Cancel
            </Button>
            <Button type="submit">Save title</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={deletingId !== null}
        title="Delete conversation"
        message="Remove this conversation from the current session? Reloading restores the supplied demo source."
        confirmLabel="Delete"
        onCancel={() => patch({ deletingId: null })}
        onConfirm={() => {
          if (deletingId) deleteConversation(deletingId)
          patch({ deletingId: null })
        }}
      />
    </>
  )
}
