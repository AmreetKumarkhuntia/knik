/**
 * Collapsible Sidebar Component
 * Permanently visible sidebar that expands on hover
 */

import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Delete as TrashIcon,
  Settings,
  SmartToy,
  AddComment,
  Chat as ChatIcon,
  AccountTree,
} from '@mui/icons-material'
import LoadingSpinner from '$components/LoadingSpinner'
import EmptyState from '$components/EmptyState'
import { ThemeSelector } from '$sections/theme'
import type { SidebarProps } from '$types/sections/layout'
import type { Conversation } from '$types/api'
import { ConversationAPI } from '$services/api'
import { UI_TEXT, NAV_ITEMS, EMPTY_STATE_DEFAULTS } from '$lib/constants'

export default function Sidebar({ onClearHistory, onNewChat, onSelectConversation }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [themeSelectorOpen, setThemeSelectorOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const isExpanded = isHovered

  useEffect(() => {
    if (isExpanded) {
      void fetchConversations()
    }
  }, [isExpanded])

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

  const handleClearHistory = () => {
    onClearHistory()
    setConversations([])
  }

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id)
    // Navigate to home page if not already there
    if (location.pathname !== '/') {
      void navigate('/')
    }
  }

  /**
   * Derive a display label for a conversation.
   * Prefer the AI-generated title; fall back to the first user message preview.
   */
  const getConversationLabel = (conv: Conversation): string => {
    if (conv.title) return conv.title
    const firstUserMsg = conv.messages.find(m => m.role === 'user')
    if (firstUserMsg) {
      return firstUserMsg.content.length > 40
        ? firstUserMsg.content.slice(0, 40) + '...'
        : firstUserMsg.content
    }
    return 'New Chat'
  }

  /**
   * Format a timestamp for the sidebar (e.g. "Today", "Yesterday", or "Mar 25").
   */
  const formatTimestamp = (isoString: string | null): string => {
    if (!isoString) return ''
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <motion.div
        initial={false}
        animate={{ width: isExpanded ? '320px' : '80px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="h-full bg-surfaceGlass backdrop-blur-3xl border-r border-borderLight z-50 shadow-2xl flex-shrink-0"
        style={{
          boxShadow: 'var(--color-shadow-subtle)',
        }}
      >
        <div className="flex flex-col h-full py-4">
          {/* Header */}
          <div
            className={`flex items-center mb-6 ${isExpanded ? 'px-6 justify-between' : 'justify-center'}`}
          >
            <div className={`flex items-center gap-2 ${isExpanded ? '' : 'justify-center w-full'}`}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                <SmartToy style={{ color: 'var(--color-primary)', fontSize: '24px' }} />
              </div>
              {isExpanded && <h2 className="text-xl font-bold text-foreground">Knik AI</h2>}
            </div>
          </div>

          {/* New Chat Button */}
          <div className={`mb-6 ${isExpanded ? 'px-6' : 'flex justify-center'}`}>
            <button
              onClick={() => {
                onNewChat()
              }}
              className={`
                font-medium transition-all
                ${
                  isExpanded
                    ? 'w-full text-secondary hover:text-foreground hover:bg-surface px-4 py-3 rounded-lg'
                    : 'w-12 h-12 flex items-center justify-center text-secondary hover:text-foreground hover:bg-surface rounded-lg'
                }
              `}
              title={isExpanded ? undefined : UI_TEXT.nav.newChat}
            >
              <AddComment />
              {isExpanded && <span className="ml-3">{UI_TEXT.nav.newChat}</span>}
            </button>
          </div>

          {/* Navigation */}
          <div className="mb-6 border-b border-border pb-4">
            <h3
              className={`text-sm font-semibold text-secondary mb-3 ${isExpanded ? 'px-6' : 'hidden'}`}
            >
              {UI_TEXT.nav.navigation}
            </h3>
            <div className={`flex flex-col gap-1 ${isExpanded ? 'px-4' : 'items-center'}`}>
              {NAV_ITEMS.map(item => (
                <button
                  key={item.path}
                  onClick={() => {
                    void navigate(item.path)
                  }}
                  className={`
                    flex items-center transition-all rounded-lg
                    ${
                      location.pathname === item.path
                        ? 'bg-primary/20 text-primary'
                        : 'text-secondary hover:bg-surface hover:text-foreground'
                    }
                    ${isExpanded ? 'justify-start px-4 py-3 w-full' : 'justify-center w-12 h-12'}
                  `}
                  title={isExpanded ? undefined : item.label}
                >
                  {item.icon === 'Chat' && <ChatIcon className={isExpanded ? 'mr-3' : ''} />}
                  {item.icon === 'AccountTree' && (
                    <AccountTree className={isExpanded ? 'mr-3' : ''} />
                  )}
                  {isExpanded && <span className="font-medium">{item.label}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Conversations - Only visible when expanded */}
          {isExpanded && (
            <div className="flex-1 overflow-y-auto mb-6 scrollbar-hide px-6">
              <h3 className="text-sm font-semibold text-secondary mb-3">
                {UI_TEXT.nav.recentConversations}
              </h3>
              <div className="space-y-1">
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
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className="w-full text-left px-3 py-3 rounded-lg text-sm text-secondary hover:bg-surface transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-secondary text-xs truncate">
                          {getConversationLabel(conv)}
                        </span>
                        <span className="text-xs text-muted ml-2 flex-shrink-0">
                          {formatTimestamp(conv.updated_at)}
                        </span>
                      </div>
                      {conv.messages.length > 0 && (
                        <div className="line-clamp-1 text-xs text-muted">
                          {conv.messages[conv.messages.length - 1].content.slice(0, 60)}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className={`space-y-3 ${isExpanded ? 'px-6' : 'items-center flex flex-col'}`}>
            <button
              onClick={() => setThemeSelectorOpen(true)}
              className={`
                text-secondary hover:text-foreground hover:bg-surface rounded-lg transition-all flex items-center
                ${isExpanded ? 'w-full px-4 py-3 gap-3' : 'w-12 h-12 justify-center'}
              `}
              title={isExpanded ? undefined : UI_TEXT.nav.themeSettings}
            >
              <SmartToy />
              {isExpanded && <span>{UI_TEXT.nav.themeSettings}</span>}
            </button>

            <button
              onClick={() => void handleClearHistory()}
              className={`
                text-secondary hover:text-foreground hover:bg-surface rounded-lg transition-all flex items-center
                ${isExpanded ? 'w-full px-4 py-3 gap-3' : 'w-12 h-12 justify-center'}
              `}
              title={isExpanded ? undefined : UI_TEXT.nav.clearHistory}
            >
              <TrashIcon />
              {isExpanded && <span>{UI_TEXT.nav.clearHistory}</span>}
            </button>

            <button
              className={`
                text-secondary hover:text-foreground hover:bg-surface rounded-lg transition-all flex items-center
                ${isExpanded ? 'w-full px-4 py-3 gap-3' : 'w-12 h-12 justify-center'}
              `}
              title={isExpanded ? undefined : UI_TEXT.nav.settings}
            >
              <Settings />
              {isExpanded && <span>{UI_TEXT.nav.settings}</span>}
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {themeSelectorOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <ThemeSelector isOpen={themeSelectorOpen} onClose={() => setThemeSelectorOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
