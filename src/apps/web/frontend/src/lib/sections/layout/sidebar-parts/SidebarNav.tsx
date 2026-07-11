import { useLocation, useNavigate } from 'react-router-dom'
import { MS } from '$components'
import { Eyebrow } from '$widgets'
import { NAV_ITEMS } from '$lib/constants'
import type { SidebarNavProps } from '$types/sections/layout'

/** Workspace navigation list. */
export default function SidebarNav({ collapsed }: SidebarNavProps) {
  const location = useLocation()
  const navigate = useNavigate()

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
    <>
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
    </>
  )
}
