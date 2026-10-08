import { memo, useState } from 'react'
import { useReactFlow, type Node as FlowNode } from '@xyflow/react'
import { getAllNodeTypes, getDefaultNodeData } from '$lib/constants/nodes'
import { generateId } from '$utils/uuid'
import { MS, Popover } from '$components'
import Button from '$components/buttons/Button'
import type { FloatingControlsProps } from '$types'

export default memo(function FloatingControls({ onAddNode }: FloatingControlsProps) {
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const handleAdd = (type: string) => {
    const node: FlowNode = {
      id: generateId('node-'),
      type,
      position: screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }),
      data: { ...getDefaultNodeData(type), type, mode: 'edit' },
    }
    onAddNode?.(node)
    setPopoverOpen(false)
  }
  return (
    <>
      {onAddNode && (
        <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 z-10">
          <Popover
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            placement="top-start"
            renderTrigger={props => (
              <Button {...props} variant="primary" size="sm" icon={<MS name="add" size={16} />}>
                Add Node
              </Button>
            )}
            content={
              <div className="w-52">
                <p className="px-3 py-2 text-xs font-semibold uppercase text-secondary">Add Node</p>
                {getAllNodeTypes().map(node => (
                  <Button
                    key={node.type}
                    variant="ghost"
                    onClick={() => handleAdd(node.type)}
                    className="!justify-start w-full text-left gap-3"
                  >
                    <MS name={node.icon} size={18} />
                    <span>
                      <span className="block text-xs font-medium">{node.label}</span>
                      <span className="block text-[10px] text-muted">{node.typeLabel}</span>
                    </span>
                  </Button>
                ))}
              </div>
            }
          />
        </div>
      )}
      <div className="absolute top-3 right-3 sm:top-auto sm:bottom-6 sm:right-6 flex flex-col gap-2 z-10">
        <Button variant="secondary" size="sm" aria-label="Zoom In" onClick={() => void zoomIn()}>
          <MS name="add" size={16} />
        </Button>
        <Button variant="secondary" size="sm" aria-label="Zoom Out" onClick={() => void zoomOut()}>
          <MS name="remove" size={16} />
        </Button>
        <Button variant="secondary" size="sm" aria-label="Fit View" onClick={() => void fitView()}>
          <MS name="center_focus_strong" size={16} />
        </Button>
      </div>
    </>
  )
})
