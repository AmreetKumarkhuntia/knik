import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Modal, ConfirmDialog, Input } from '$components'
import Button from '$components/buttons/Button'
import SidebarBrand from '$components/layout/SidebarBrand'
import SidebarQuickActions from '$components/layout/SidebarQuickActions'
import SidebarNav from '$components/layout/SidebarNav'
import SidebarRecents from '$components/layout/SidebarRecents'
import SidebarAccount from '$components/layout/SidebarAccount'
import { useDemoSession } from '$widgets/session/useDemoSession'
import type { SidebarWidgetProps } from '$types/widgets/chat-shell'
import type { Conversation } from '$types/conversation'

export default function SidebarWidget({ onOpenSearch }: SidebarWidgetProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const conversations = useDemoSession(state => state.conversations)
  const settings = useDemoSession(state => state.settings)
  const startConversation = useDemoSession(state => state.startConversation)
  const selectConversation = useDemoSession(state => state.selectConversation)
  const renameConversation = useDemoSession(state => state.renameConversation)
  const deleteConversation = useDemoSession(state => state.deleteConversation)
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 768)
  const [editing, setEditing] = useState<Conversation | null>(null)
  const [deleting, setDeleting] = useState<Conversation | null>(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const accountName = settings.display_name || settings.username || ''
  const initials =
    accountName
      .trim()
      .split(/\s+/)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) setCollapsed(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const newChat = () => {
    startConversation()
    void navigate('/')
  }

  const closeEditor = () => {
    setEditing(null)
    setTitle('')
    setError('')
  }

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
        <SidebarBrand collapsed={collapsed} onToggle={() => setCollapsed(value => !value)} />
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
            onRename={conversation => {
              setEditing(conversation)
              setTitle(conversation.title || '')
              setError('')
            }}
            onDelete={setDeleting}
          />
        ) : (
          <div className="flex-1" />
        )}
        <SidebarAccount collapsed={collapsed} name={accountName} initials={initials} />
      </motion.aside>
      <Modal isOpen={editing !== null} onClose={closeEditor} title="Rename conversation" size="sm">
        <form
          onSubmit={event => {
            event.preventDefault()
            if (!title.trim()) {
              setError('Enter a conversation title.')
              return
            }
            if (editing) renameConversation(editing.id, title.trim())
            closeEditor()
          }}
        >
          <label htmlFor="conversation-title" className="block text-sm text-fg-2 mb-2">
            Title
          </label>
          <Input
            id="conversation-title"
            value={title}
            onChange={event => {
              setTitle(event.target.value)
              setError('')
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
        isOpen={deleting !== null}
        title="Delete conversation"
        message="Remove this conversation from the current session? Reloading restores the supplied demo source."
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteConversation(deleting.id)
          setDeleting(null)
        }}
      />
    </>
  )
}
