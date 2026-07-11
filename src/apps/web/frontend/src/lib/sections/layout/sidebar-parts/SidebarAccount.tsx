import { useNavigate } from 'react-router-dom'
import { Avatar, MS } from '$components'
import { ROUTES, DEMO_ACCOUNT } from '$lib/constants'
import type { SidebarAccountProps } from '$types/sections/layout'

/** Account footer that navigates to settings. */
export default function SidebarAccount({ collapsed }: SidebarAccountProps) {
  const navigate = useNavigate()
  return (
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
  )
}
