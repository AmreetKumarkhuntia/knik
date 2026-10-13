import { memo, useRef, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import { getAllNodeTypes } from '$lib/constants/nodes'
import { MS, Popover } from '$components'
import Button from '$components/buttons/Button'
import type { FloatingControlsProps } from '$types'

export default memo(function FloatingControls({ onAddNode }: FloatingControlsProps) {
  const { screenToFlowPosition } = useReactFlow()
  const anchor = useRef<HTMLDivElement>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const handleAdd = (type: string) => {
    const bounds = anchor.current?.closest('.react-flow')?.getBoundingClientRect()
    if (!bounds) return
    onAddNode?.(
      type,
      screenToFlowPosition({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 })
    )
    setPopoverOpen(false)
  }
  if (!onAddNode) return null
  return (
    <div ref={anchor} className="absolute top-4 left-4 z-10 nodrag nopan">
      <Popover
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        placement="bottom-start"
        label="Choose a step"
        renderTrigger={props => (
          <Button
            {...props}
            variant="secondary"
            size="sm"
            className="bg-surface border-border-2 text-fg-1 rounded-[11px] shadow-knik-float"
            icon={
              <MS
                name="add"
                size={18}
                className={`transition-transform duration-slow ease-spring ${popoverOpen ? 'rotate-45' : ''}`}
              />
            }
          >
            Add Node
          </Button>
        )}
        content={
          <div className="flex w-[246px] max-w-full flex-col">
            <p className="px-3 pt-2 pb-1.5 text-caption text-fg-4">Choose a step</p>
            {getAllNodeTypes().map(node => (
              <Button
                key={node.type}
                variant="ghost"
                onClick={() => handleAdd(node.type)}
                className="w-full justify-start gap-3 px-2.5 py-2 rounded-[10px] text-left"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${node.colors.iconBg} ${node.colors.iconText}`}
                >
                  <MS name={node.icon} size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-label text-fg-1">{node.label}</span>
                  <span className="block text-caption text-fg-4 font-normal">{node.typeLabel}</span>
                </span>
              </Button>
            ))}
          </div>
        }
      />
    </div>
  )
})
