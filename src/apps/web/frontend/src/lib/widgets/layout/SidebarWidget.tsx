import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
import type { SidebarWidgetProps } from '$types/widgets/chat-shell'

export default function SidebarWidget({ onOpenSearch }: SidebarWidgetProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { conversations, accountName, initials } = useSidebarView()
  const startConversation = useChatStore(state => state.startConversation)
  const selectConversation = useChatStore(state => state.selectConversation)
  const deleteConversation = useChatStore(state => state.deleteConversation)
  const beginRename = useChatStore(state => state.beginRename)
  const cancelRename = useChatStore(state => state.cancelRename)
  const saveRename = useChatStore(state => state.saveRename)
  const collapsed = useShellStore(state => state.collapsed)
  const setCollapsed = useShellStore(state => state.setCollapsed)
  const { scopeId, scope, patch } = useChatScope()
  const { editingId, deletingId, title, error } = scope

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) setCollapsed(true)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setCollapsed])

  const newChat = () => {
    startConversation()
    void navigate('/')
  }

  const closeEditor = () => cancelRename(scopeId)

  return (
    <>
      <motion.aside
        aria-label="Workspace sidebar"
        initial={false}
        animate={{ width: collapsed ? 76 : 264 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="h-full flex flex-col flex-shrink-0 overflow-hidden"
        style={{
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          borderRight: '1px solid var(--border-2)',
          padding: collapsed ? '16px' : '16px 14px',
        }}
      >
        <SidebarBrand collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <SidebarQuickActions
          collapsed={collapsed}
          onNewChat={newChat}
          onOpenSearch={onOpenSearch}
        />
        <SidebarNav collapsed={collapsed} pathname={location.pathname} />
        {!collapsed ? (
          <SidebarRecents
            conversations={conversations}
            loading={false}
            onSelect={id => {
              selectConversation(id)
              void navigate('/')
            }}
            onRename={conversation => beginRename(scopeId, conversation)}
            onDelete={conversation => patch({ deletingId: conversation.id })}
          />
        ) : (
          <div className="flex-1" />
        )}
        <SidebarAccount collapsed={collapsed} name={accountName} initials={initials} />
      </motion.aside>
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
