/**
 * Sidebar Component
 * ChatGPT-style collapsible sidebar with history and settings
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '$services'
import { CloseIcon, TrashIcon, SettingsIcon } from '$components/icons'
import Backdrop from '$components/Backdrop'
import IconButton from '$components/IconButton'
import LoadingSpinner from '$components/LoadingSpinner'
import EmptyState from '$components/EmptyState'
import LinkButton from '$components/LinkButton'
import type { SidebarProps } from '$types/sections/layout'
import type { Message } from '$types/hooks'

export default function Sidebar({ isOpen, onClose, onClearHistory, onNewChat }: SidebarProps) {
  const location = useLocation()
  const [history, setHistory] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch history when sidebar opens
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

      <div
        className={`fixed top-0 left-0 h-full w-80 bg-black/10 backdrop-blur-3xl border-r border-white/30
                    z-40 transform transition-transform duration-300 ease-in-out shadow-2xl
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-6 pt-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xl">🤖</div>
              Knik AI
            </h2>
            <IconButton icon={<CloseIcon />} onClick={onClose} ariaLabel="Close sidebar" />
          </div>

          <button
            onClick={() => {
              onNewChat()
              onClose()
            }}
            className="w-full text-white/70 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg font-medium mb-6
                     transition-all duration-200"
          >
            New Chat
          </button>

          <div className="mb-6 border-b border-white/10 pb-4">
            <h3 className="text-sm font-semibold text-white/50 mb-3 px-2">Navigation</h3>
            <div className="space-y-1">
              <LinkButton
                icon="💬"
                label="Chat"
                active={location.pathname === '/'}
                onClick={() => onClose()}
              />
              <LinkButton
                icon="⚙️"
                label="Workflows"
                active={location.pathname === '/workflows'}
                onClick={() => onClose()}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mb-6 scrollbar-hide">
            <h3 className="text-sm font-semibold text-white/50 mb-3 px-2">Recent Conversations</h3>
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
                history.map((msg, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-white/50 text-xs mb-1">
                      {msg.role === 'user' ? 'You' : 'Knik'}
                    </div>
                    <div className="line-clamp-2">{msg.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-white/20 pt-4 space-y-2">
            <button
              onClick={() => void handleClearHistory()}
              className="w-full text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/10
                       rounded-lg transition-all flex items-center gap-3"
            >
              <TrashIcon />
              Clear History
            </button>

            <button
              className="w-full text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/10
                       rounded-lg transition-all flex items-center gap-3"
            >
              <SettingsIcon />
              Settings
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
