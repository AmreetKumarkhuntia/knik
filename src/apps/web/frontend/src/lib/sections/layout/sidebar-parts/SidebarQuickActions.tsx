import { Kbd, MS } from '$components'
import { UI_TEXT } from '$lib/constants'
import type { SidebarQuickActionsProps } from '$types/sections/layout'

/** New-chat button and (when expanded) the search launcher. */
export default function SidebarQuickActions({
  collapsed,
  onNewChat,
  onOpenSearch,
}: SidebarQuickActionsProps) {
  return (
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
  )
}
