import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  SidebarBrand,
  SidebarQuickActions,
  SidebarNav,
  SidebarRecents,
  SidebarAccount,
} from './sidebar-parts'
import type { SidebarProps } from '$types/sections/layout'
import type { Conversation } from '$types/api'
import { ConversationAPI } from '$services/api'
import { useStore } from '$store/index'

/** Collapsible, sectioned sidebar: brand, new-chat, workspace nav, recents, account. */
export default function Sidebar({ onNewChat, onSelectConversation, onOpenSearch }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Chat state from the store, used to keep the recents list in sync with the
  // active conversation (new chats appear; previews/titles refresh after replies).
  const conversationId = useStore(s => s.conversationId)
  const chatLoading = useStore(s => s.loading)
  const prevChatLoading = useRef(chatLoading)

  // Fetch on expand and whenever the active conversation changes (new chat / switch).
  useEffect(() => {
    if (collapsed) return
    void fetchConversations()
  }, [collapsed, conversationId])

  // Refresh recents (titles + previews) when a reply finishes streaming.
  useEffect(() => {
    if (prevChatLoading.current && !chatLoading && !collapsed) {
      void fetchConversations()
    }
    prevChatLoading.current = chatLoading
  }, [chatLoading, collapsed])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const data = await ConversationAPI.list(10)
      setConversations(data.conversations)
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id)
    if (location.pathname !== '/') void navigate('/')
  }

  const handleRename = async (conv: Conversation) => {
    const next = window.prompt('Rename conversation', conv.title ?? '')
    if (next === null) return
    const title = next.trim()
    if (!title || title === conv.title) return
    try {
      await ConversationAPI.updateTitle(conv.id, title)
      await fetchConversations()
    } catch (error) {
      console.error('Failed to rename conversation:', error)
    }
  }

  const handleDelete = async (conv: Conversation) => {
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return
    try {
      await ConversationAPI.delete(conv.id)
      if (conversationId === conv.id) onNewChat()
      await fetchConversations()
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  return (
    <motion.aside
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
      <SidebarBrand collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <SidebarQuickActions
        collapsed={collapsed}
        onNewChat={onNewChat}
        onOpenSearch={onOpenSearch}
      />
      <SidebarNav collapsed={collapsed} />
      {!collapsed ? (
        <SidebarRecents
          conversations={conversations}
          loading={loading}
          onSelect={handleSelectConversation}
          onRename={conv => void handleRename(conv)}
          onDelete={conv => void handleDelete(conv)}
        />
      ) : (
        <div style={{ flex: 1 }} />
      )}
      <SidebarAccount collapsed={collapsed} />
    </motion.aside>
  )
}
