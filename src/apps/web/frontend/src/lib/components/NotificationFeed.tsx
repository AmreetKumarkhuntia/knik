import type { ReactNode } from 'react'
import { DEFAULT_NOTIFICATIONS } from '$constants/demoData'

export interface NotificationItem {
  id: string
  type: 'success' | 'fail' | 'info' | 'user'
  title: ReactNode
  time: string
  unread: boolean
}

export interface NotificationFeedProps {
  notifications?: NotificationItem[]
  onDismiss: (id: string) => void
  onMarkRead: () => void
  className?: string
}

const ICONS = {
  success: {
    name: 'check',
    style: 'bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-[var(--success)]',
  },
  fail: {
    name: 'priority_high',
    style: 'bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] text-[var(--danger)]',
  },
  info: {
    name: 'campaign',
    style: 'bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] text-[var(--aurora-300)]',
  },
  user: {
    name: 'person',
    style: 'bg-[color-mix(in_srgb,var(--violet-500)_18%,transparent)] text-[var(--violet-400)]',
  },
}

export default function NotificationFeed({
  notifications = DEFAULT_NOTIFICATIONS,
  onDismiss,
  onMarkRead,
  className = '',
}: NotificationFeedProps) {
  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <div
      className={`w-[380px] bg-[var(--bg-glass)] backdrop-blur-[20px] saturate-[1.4] border border-[var(--border-2)] rounded-lg overflow-hidden shadow-knik-3 ${className}`}
    >
      <div className="flex items-center justify-between py-3 px-3.5 border-b border-[var(--border-2)]">
        <h3 className="m-0 text-[13.5px] font-semibold text-[var(--fg-1)] tracking-tight">
          Notifications · {unreadCount} new
        </h3>
        <button
          onClick={onMarkRead}
          className="text-[11.5px] text-[var(--aurora-300)] bg-transparent border-none cursor-pointer hover:underline p-0"
        >
          Mark all read
        </button>
      </div>

      <div>
        {notifications.map(item => {
          const iconConf = ICONS[item.type]
          return (
            <div
              key={item.id}
              className="group flex gap-2.5 p-[11px_14px] border-b border-[var(--border-1)] last:border-b-0 relative hover:bg-[var(--bg-surface-2)] transition-colors"
            >
              {item.unread && (
                <div className="absolute left-[6px] top-[18px] w-[5px] h-[5px] rounded-full bg-[var(--aurora-400)] shadow-[0_0_6px_var(--aurora-400)]" />
              )}

              <div
                className={`w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0 mt-[1px] ${iconConf.style}`}
              >
                <span className="material-symbols-outlined text-[14px]">{iconConf.name}</span>
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="text-[13px] text-[var(--fg-1)] tracking-tight [&>b]:font-semibold">
                  {item.title}
                </div>
                <div className="font-mono text-[10.5px] text-[var(--fg-5)] mt-[3px]">
                  {item.time}
                </div>
              </div>

              <button
                onClick={() => onDismiss(item.id)}
                className="absolute right-[14px] top-[14px] opacity-0 group-hover:opacity-100 text-[var(--fg-4)] hover:text-[var(--fg-1)] bg-transparent border-none cursor-pointer transition-opacity p-0"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
