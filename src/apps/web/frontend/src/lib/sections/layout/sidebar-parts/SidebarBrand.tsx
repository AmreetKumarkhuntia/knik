import { KnikGlyph, MS } from '$components'
import type { SidebarBrandProps } from '$types/sections/layout'

/** Brand mark + status; the whole row toggles collapse. */
export default function SidebarBrand({ collapsed, onToggle }: SidebarBrandProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
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
          <div className="flex items-center" style={{ gap: 5, fontSize: 11, color: 'var(--fg-4)' }}>
            <span
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }}
            />
            Local · running
          </div>
        </div>
      )}
      {!collapsed && <MS name="unfold_more" size={16} style={{ color: 'var(--fg-5)' }} />}
    </button>
  )
}
