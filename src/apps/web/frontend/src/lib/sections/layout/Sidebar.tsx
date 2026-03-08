/**
 * Sidebar Component
 * ChatGPT-style collapsible sidebar with history, profile, and theme selector
 */

import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Close,
  Delete as TrashIcon,
  Settings,
  ChevronRight,
  SmartToy,
  ChatBubbleOutline,
  AccountTree,
  Palette,
} from '@mui/icons-material'
import Backdrop from '$components/Backdrop'
import LoadingSpinner from '$components/LoadingSpinner'
import EmptyState from '$components/EmptyState'
import { ThemeToggle, ThemeSelector } from '$sections/theme'
import type { SidebarProps } from '$types/sections/layout'
import type { Message } from '$types/hooks'
import { api } from '$services'

export default function Sidebar({ isOpen, onClose, onClearHistory, onNewChat }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [history, setHistory] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [themeSelectorOpen, setThemeSelectorOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      void fetchHistory()
    }
  }, [isOpen])

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
    onClose()
  }

  return (
    <>
      <Backdrop visible={isOpen} onClick={onClose} blur="sm" />

      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? '0' : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full w-80 bg-surfaceGlass backdrop-blur-3xl border-r border-borderLight z-40 shadow-2xl"
        style={{
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-6 pt-2">
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <SmartToy style={{ color: 'var(--color-primary)' }} />
              </div>
              Knik AI
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-textSecondary hover:text-text hover:bg-white/10 transition-all duration-200"
              aria-label="Close sidebar"
            >
              <Close />
            </button>
          </div>

          <button
            onClick={() => {
              onNewChat()
              onClose()
            }}
            className="w-full text-textSecondary hover:text-text hover:bg-white/10 px-4 py-3 rounded-lg font-medium mb-6 transition-all duration-200"
          >
            New Chat
          </button>

          <div className="mb-6 border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-textSecondary mb-3 px-2">Navigation</h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  void navigate('/')
                  onClose()
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  location.pathname === '/'
                    ? 'bg-primary/10 text-text'
                    : 'text-textSecondary hover:text-text hover:bg-white/5'
                }`}
              >
                <ChatBubbleOutline />
                Chat
              </button>
              <button
                onClick={() => {
                  void navigate('/workflows')
                  onClose()
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  location.pathname === '/workflows'
                    ? 'bg-primary/10 text-text'
                    : 'text-textSecondary hover:text-text hover:bg-white/5'
                }`}
              >
                <AccountTree />
                Workflows
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mb-6 scrollbar-hide">
            <h3 className="text-sm font-semibold text-textSecondary mb-3 px-2">
              Recent Conversations
            </h3>
            <div className="space-y-1">
              {loading ? (
                <LoadingSpinner size="sm" className="py-8" />
              ) : history.length === 0 ? (
                <EmptyState
                  icon="💬"
                  title="No history yet"
                  description="Start a conversation to see it here"
                />
              ) : (
                history.slice(0, 5).map((msg, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 4 }}
                    className="px-3 py-3 rounded-lg text-sm text-textSecondary hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-textSecondary text-xs mb-1">
                        {msg.role === 'user' ? 'You' : 'Knik'}
                      </div>
                      <div className="line-clamp-2">{msg.content}</div>
                    </div>
                    <ChevronRight
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ fontSize: 16 }}
                    />
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-surface border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-text font-semibold bg-primary/20">
                  AR
                </div>
                <div>
                  <div className="text-sm font-medium text-text">Alex Rivera</div>
                  <div className="text-xs text-textSecondary">Pro Account</div>
                </div>
              </div>
              <ThemeToggle />
            </div>

            <button
              onClick={() => setThemeSelectorOpen(true)}
              className="w-full text-left px-4 py-3 text-textSecondary hover:text-text hover:bg-white/10 rounded-lg transition-all flex items-center gap-3"
            >
              <Palette />
              Theme Settings
            </button>

            <button
              onClick={() => void handleClearHistory()}
              className="w-full text-left px-4 py-3 text-textSecondary hover:text-text hover:bg-white/10 rounded-lg transition-all flex items-center gap-3"
            >
              <TrashIcon />
              Clear History
            </button>

            <button className="w-full text-left px-4 py-3 text-textSecondary hover:text-text hover:bg-white/10 rounded-lg transition-all flex items-center gap-3">
              <Settings />
              Settings
            </button>
          </div>
        </div>
      </motion.div>

      <ThemeSelector isOpen={themeSelectorOpen} onClose={() => setThemeSelectorOpen(false)} />
    </>
  )
}
