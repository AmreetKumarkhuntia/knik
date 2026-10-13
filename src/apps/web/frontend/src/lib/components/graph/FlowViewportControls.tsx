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
      className="absolute bottom-4 left-4 z-10 flex flex-col gap-0.5 p-1 rounded-[12px] bg-surface border border-border-2 shadow-[0_10px_30px_-20px_rgba(0,0,0,.8)] nodrag nopan"
    >
      <Button
        variant="ghost"
        size="sm"
        className="knik-btn--icon rounded-[9px]"
        aria-label="Zoom In"
        onClick={() => void zoomIn()}
      >
        <MS name="add" size={18} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="knik-btn--icon rounded-[9px]"
        aria-label="Zoom Out"
        onClick={() => void zoomOut()}
      >
        <MS name="remove" size={18} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="knik-btn--icon rounded-[9px]"
        aria-label="Fit View"
        onClick={onFit}
      >
        <MS name="fit_screen" size={18} />
      </Button>
      <output
        className="pt-0.5 pb-1 text-center font-mono text-micro text-fg-4 tabular-nums"
        aria-label="Zoom level"
      >
        {Math.round(zoom * 100)}%
      </output>
    </div>
  )
}
