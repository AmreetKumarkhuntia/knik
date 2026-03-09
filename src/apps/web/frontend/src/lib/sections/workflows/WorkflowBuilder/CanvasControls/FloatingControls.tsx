import { memo } from 'react'
import { useReactFlow } from '@xyflow/react'

export default memo(function FloatingControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
      <button
        onClick={() => void zoomIn()}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-surface dark:bg-white/5 shadow-xl border border-borderLight text-textSecondary hover:text-accent-teal transition-colors"
        title="Zoom In"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
      <button
        onClick={() => void zoomOut()}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-surface dark:bg-white/5 shadow-xl border border-borderLight text-textSecondary hover:text-accent-teal transition-colors"
        title="Zoom Out"
      >
        <span className="material-symbols-outlined">remove</span>
      </button>
      <button
        onClick={() => void fitView()}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-surface dark:bg-white/5 shadow-xl border border-borderLight text-textSecondary hover:text-accent-teal transition-colors"
        title="Fit View"
      >
        <span className="material-symbols-outlined">center_focus_strong</span>
      </button>
    </div>
  )
})
