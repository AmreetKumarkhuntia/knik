import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import MS from '$components/MS'
import Kbd from '$components/Kbd'
import Avatar from '$components/Avatar'
import ActionIcon from '$components/ActionIcon'
import KnikGlyph from '$components/KnikGlyph'
import LoadingSpinner from '$components/LoadingSpinner'
import EmptyState from '$components/EmptyState'
import type { SidebarProps } from '$types/sections/layout'
import type { Conversation } from '$types/api'
import { ConversationAPI } from '$services/api'
import { useStore } from '$store/index'
import { NAV_ITEMS, ROUTES, UI_TEXT, EMPTY_STATE_DEFAULTS, DEMO_ACCOUNT } from '$lib/constants'

/** Eyebrow: small mono section label. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono uppercase"
      style={{
        fontSize: 10,
        letterSpacing: '0.09em',
        color: 'var(--fg-4)',
        padding: '10px 11px 7px',
      }}
    >
      {children}
    </div>
  )
}

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

  const getConversationLabel = (conv: Conversation): string => conv.title || 'New chat'

  const formatTimestamp = (isoString: string | null): string => {
    if (!isoString) return ''
    const date = new Date(isoString)
    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    padding: collapsed ? 0 : '9px 11px',
    height: collapsed ? 44 : undefined,
    width: collapsed ? 44 : '100%',
    marginInline: collapsed ? 'auto' : 0,
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: 'var(--r-btn, 8px)',
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--acc-soft)' : 'transparent',
    color: active ? 'var(--acc-text, var(--aurora-200))' : 'var(--fg-3)',
    fontSize: 13.5,
    fontWeight: 550,
    letterSpacing: '-0.01em',
    transition: 'all 160ms var(--ease-out)',
  })

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
      {/* Brand / collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expand' : 'Collapse'}
        className="flex items-center"
        style={{
          gap: 10,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: collapsed ? 0 : '4px 6px',
          marginBottom: 14,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: 'rgba(11,18,26,0.7)',
            border: '1px solid var(--acc-border, rgba(0,217,244,0.4))',
            boxShadow: '0 0 24px -6px var(--acc-glow, rgba(0,217,244,0.55))',
          }}
        >
          <KnikGlyph size={22} />
        </div>
        {!collapsed && (
          <div className="text-left min-w-0 flex-1">
            <div
              className="font-display"
              style={{
                fontWeight: 600,
                fontSize: 16,
                letterSpacing: '-0.025em',
                color: 'var(--fg-1)',
                lineHeight: 1.1,
              }}
            >
              Knik AI
            </div>
            <div
              className="flex items-center"
              style={{ gap: 5, fontSize: 11, color: 'var(--fg-4)' }}
            >
              <span
                style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }}
              />
              Local · running
            </div>
          </div>
        )}
        {!collapsed && <MS name="unfold_more" size={16} style={{ color: 'var(--fg-5)' }} />}
      </button>

      {/* New chat + search */}
      <div className="flex flex-col" style={{ gap: 6, marginBottom: 16 }}>
        <button
          type="button"
          onClick={onNewChat}
          title={collapsed ? UI_TEXT.nav.newChat : undefined}
          className="flex items-center transition-all ease-knik-out"
          style={{
            gap: 9,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '9px 12px',
            height: collapsed ? 44 : undefined,
            width: collapsed ? 44 : '100%',
            marginInline: collapsed ? 'auto' : 0,
            borderRadius: 'var(--r-btn, 8px)',
            border: '1px solid var(--acc-border, rgba(0,217,244,0.35))',
            cursor: 'pointer',
            background: 'var(--acc-soft)',
            color: 'var(--acc-text, var(--aurora-200))',
            fontSize: 13.5,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          <MS name="add" size={20} />
          {!collapsed && 'New chat'}
        </button>
        {!collapsed && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center transition-all ease-knik-out"
            style={{
              gap: 9,
              padding: '8px 12px',
              width: '100%',
              borderRadius: 'var(--r-btn, 8px)',
              border: '1px solid var(--border-2)',
              cursor: 'pointer',
              background: 'var(--bg-surface)',
              color: 'var(--fg-4)',
              fontSize: 13,
            }}
          >
            <MS name="search" size={18} />
            <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
            <Kbd>⌘K</Kbd>
          </button>
        )}
      </div>

      {/* Nav */}
      {!collapsed && <Eyebrow>Workspace</Eyebrow>}
      <div className="flex flex-col" style={{ gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => void navigate(item.path)}
              title={collapsed ? item.label : undefined}
              style={navItemStyle(active)}
            >
              {active && !collapsed && (
                <span
                  style={{
                    position: 'absolute',
                    left: -14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 18,
                    borderRadius: 999,
                    background: 'var(--acc, var(--aurora-400))',
                  }}
                />
              )}
              <MS name={item.icon} size={20} fill={active ? 1 : 0} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </div>

      {/* Recents */}
      {!collapsed ? (
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
                    onClick={() => handleSelectConversation(conv.id)}
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
                        {formatTimestamp(conv.updated_at)}
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
                      onClick={() => void handleRename(conv)}
                    />
                    <ActionIcon
                      size={26}
                      icon={<MS name="delete" size={13} />}
                      title="Delete"
                      danger
                      onClick={() => void handleDelete(conv)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {/* Account footer */}
      <div style={{ marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--border-1)' }}>
        <button
          type="button"
          onClick={() => void navigate(ROUTES.settings)}
          title={collapsed ? 'Settings & account' : undefined}
          className="flex items-center transition-colors"
          style={{
            gap: 10,
            width: collapsed ? 44 : '100%',
            marginInline: collapsed ? 'auto' : 0,
            padding: collapsed ? 0 : '8px',
            height: collapsed ? 44 : undefined,
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 'var(--r-btn, 8px)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Avatar initials={DEMO_ACCOUNT.initials} size={collapsed ? 32 : 30} color="accent" />
          {!collapsed && (
            <div className="text-left flex-1 min-w-0">
              <div
                className="truncate"
                style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-1)' }}
              >
                {DEMO_ACCOUNT.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-4)' }}>Local account</div>
            </div>
          )}
          {!collapsed && <MS name="settings" size={17} style={{ color: 'var(--fg-4)' }} />}
        </button>
      </div>
    </motion.aside>
  )
}
