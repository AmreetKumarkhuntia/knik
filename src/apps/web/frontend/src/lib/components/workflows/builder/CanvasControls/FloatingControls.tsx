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
        renderTrigger={props => (
          <Button {...props} variant="secondary" size="sm" icon={<MS name="add" size={18} />}>
            Add Node
          </Button>
        )}
        content={
          <div className="w-60 p-1">
            <p className="px-3 py-2 text-xs text-secondary">Choose a step</p>
            {getAllNodeTypes().map(node => (
              <Button
                key={node.type}
                variant="ghost"
                onClick={() => handleAdd(node.type)}
                className="!justify-start w-full text-left gap-3 !py-2"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${node.colors.iconBg} ${node.colors.iconText}`}
                >
                  <MS name={node.icon} size={18} />
                </span>
                <span>
                  <span className="block text-sm font-medium">{node.label}</span>
                  <span className="block text-xs font-normal text-secondary">{node.typeLabel}</span>
                </span>
              </Button>
            ))}
          </div>
        }
      />
    </div>
  )
})
