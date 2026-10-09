import { useReactFlow, useViewport } from '@xyflow/react'
import Button from '../buttons/Button'
import MS from '../display/MS'
import type { FlowViewportControlsProps } from '$types/graph'

export default function FlowViewportControls({ onFit }: FlowViewportControlsProps) {
  const { zoomIn, zoomOut } = useReactFlow()
  const { zoom } = useViewport()
  return (
    <div
      role="group"
      aria-label="Graph view controls"
      className="absolute bottom-4 left-4 z-10 flex items-center gap-1 p-1 rounded-[10px] border border-border bg-surface shadow-knik-2 nodrag nopan"
    >
      <Button variant="ghost" size="sm" aria-label="Zoom Out" onClick={() => void zoomOut()}>
        <MS name="remove" size={18} />
      </Button>
      <output
        className="w-12 text-center text-xs text-secondary tabular-nums"
        aria-label="Zoom level"
      >
        {Math.round(zoom * 100)}%
      </output>
      <Button variant="ghost" size="sm" aria-label="Zoom In" onClick={() => void zoomIn()}>
        <MS name="add" size={18} />
      </Button>
      <span className="h-5 w-px bg-border-2 mx-1" aria-hidden="true" />
      <Button variant="ghost" size="sm" aria-label="Fit View" onClick={onFit}>
        <MS name="center_focus_strong" size={18} />
      </Button>
    </div>
  )
}
