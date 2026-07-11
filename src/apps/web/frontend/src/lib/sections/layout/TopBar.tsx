import { Fragment } from 'react'
import { MS, ActionIcon, Kbd } from '$components'
import type { TopBarProps } from '$types/sections/layout'

/** Command-bar top bar: breadcrumbs, global search, per-page actions, theme + notifications. */
export default function TopBar({
  crumbs = [],
  right,
  onOpenSearch,
  dark,
  onToggleTheme,
  notif = 3,
}: TopBarProps) {
  return (
    <header
      className="flex items-center flex-shrink-0 relative"
      style={{
        height: 64,
        paddingInline: 24,
        gap: 20,
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderBottom: '1px solid var(--border-2)',
        zIndex: 5,
      }}
    >
      <nav className="flex items-center flex-shrink-0" style={{ gap: 8, fontSize: 14 }}>
        {crumbs.map((b, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <Fragment key={i}>
              <span
                style={{
                  color: isLast ? 'var(--fg-1)' : 'var(--fg-4)',
                  fontWeight: isLast ? 600 : 500,
                  letterSpacing: '-0.012em',
                }}
              >
                {b}
              </span>
              {!isLast && <span style={{ color: 'var(--fg-5)', fontSize: 13 }}>/</span>}
            </Fragment>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={onOpenSearch}
        className="flex items-center transition-all duration-150 ease-knik-out"
        style={{
          flex: 1,
          maxWidth: 460,
          marginInline: 'auto',
          gap: 10,
          padding: '8px 12px',
          borderRadius: 'var(--r-btn, 8px)',
          border: '1px solid var(--border-2)',
          background: 'var(--bg-surface)',
          color: 'var(--fg-4)',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        <MS name="search" size={18} />
        <span style={{ flex: 1, textAlign: 'left' }}>Search or run a command…</span>
        <Kbd>⌘K</Kbd>
      </button>

      <div className="flex items-center flex-shrink-0" style={{ gap: 8 }}>
        {right}
        <div style={{ width: 1, height: 22, background: 'var(--border-2)', marginInline: 4 }} />
        <ActionIcon
          title={dark ? 'Light mode' : 'Dark mode'}
          onClick={onToggleTheme}
          icon={<MS name={dark ? 'light_mode' : 'dark_mode'} size={19} />}
        />
        <div style={{ position: 'relative' }}>
          <ActionIcon title="Notifications" icon={<MS name="notifications" size={19} />} />
          {notif > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--acc, var(--aurora-400))',
                border: '1.5px solid var(--bg-base)',
              }}
            />
          )}
        </div>
      </div>
    </header>
  )
}
