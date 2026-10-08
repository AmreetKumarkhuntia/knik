import Button from '$components/buttons/Button'
import { KnikGlyph, MS } from '$components'
import type { SidebarBrandProps } from '$types/widgets/chat-shell'

export default function SidebarBrand({ collapsed, onToggle }: SidebarBrandProps) {
  if (collapsed)
    return (
      <div className="flex justify-center mb-4">
        {onToggle ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <KnikGlyph size={22} />
          </Button>
        ) : (
          <div className="h-9 flex items-center">
            <KnikGlyph size={22} />
          </div>
        )}
      </div>
    )
  return (
    <div className="flex items-center h-9 mb-4 gap-2 px-2">
      <KnikGlyph size={22} />
      <span className="flex-1 text-sm font-semibold text-fg-1">Knik</span>
      {onToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
          icon={<MS name="left_panel_close" size={18} />}
        />
      )}
    </div>
  )
}
