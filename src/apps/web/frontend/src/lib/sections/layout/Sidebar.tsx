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
import type { Message } from '$types/hooks'
import { api } from '$services/api'
import { UI_TEXT, NAV_ITEMS, EMPTY_STATE_DEFAULTS } from '$lib/constants'

export default function Sidebar({ onClearHistory, onNewChat }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [history, setHistory] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [themeSelectorOpen, setThemeSelectorOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const isExpanded = isHovered

  useEffect(() => {
    if (isExpanded) {
      void fetchHistory()
    }
  }, [isExpanded])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const data = await api.getHistory()
      setHistory(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = () => {
    onClearHistory()
    setHistory([])
  }

  return (
    <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <motion.div
        initial={false}
        animate={{ width: isExpanded ? '320px' : '80px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="h-full bg-surfaceGlass backdrop-blur-3xl border-r border-borderLight z-50 shadow-2xl flex-shrink-0"
        style={{
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
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
              {isExpanded && <h2 className="text-xl font-bold text-text">Knik AI</h2>}
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
                    ? 'w-full text-textSecondary hover:text-text hover:bg-white/10 px-4 py-3 rounded-lg'
                    : 'w-12 h-12 flex items-center justify-center text-textSecondary hover:text-text hover:bg-white/10 rounded-lg'
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
              className={`text-sm font-semibold text-textSecondary mb-3 ${isExpanded ? 'px-6' : 'hidden'}`}
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
                        : 'text-textSecondary hover:bg-white/5 hover:text-text'
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
              <h3 className="text-sm font-semibold text-textSecondary mb-3">
                {UI_TEXT.nav.recentConversations}
              </h3>
              <div className="space-y-1">
                {loading ? (
                  <LoadingSpinner size="sm" className="py-8" />
                ) : history.length === 0 ? (
                  <EmptyState
                    icon={EMPTY_STATE_DEFAULTS.icon}
                    title={UI_TEXT.empty.noHistoryTitle}
                    description={UI_TEXT.empty.noHistoryDescription}
                  />
                ) : (
                  history.slice(0, 5).map((msg, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-3 rounded-lg text-sm text-textSecondary hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <div className="font-medium text-textSecondary text-xs mb-1">
                        {msg.role === 'user' ? 'You' : 'Knik'}
                      </div>
                      <div className="line-clamp-2">{msg.content}</div>
                    </div>
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
                text-textSecondary hover:text-text hover:bg-white/10 rounded-lg transition-all flex items-center
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
                text-textSecondary hover:text-text hover:bg-white/10 rounded-lg transition-all flex items-center
                ${isExpanded ? 'w-full px-4 py-3 gap-3' : 'w-12 h-12 justify-center'}
              `}
              title={isExpanded ? undefined : UI_TEXT.nav.clearHistory}
            >
              <TrashIcon />
              {isExpanded && <span>{UI_TEXT.nav.clearHistory}</span>}
            </button>

            <button
              className={`
                text-textSecondary hover:text-text hover:bg-white/10 rounded-lg transition-all flex items-center
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
