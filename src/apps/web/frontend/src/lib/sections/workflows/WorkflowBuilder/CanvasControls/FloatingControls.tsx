import { memo, useState, useEffect, useRef } from 'react'
import { useReactFlow, type Node as FlowNode } from '@xyflow/react'
import { getAllNodeTypes, getDefaultNodeData } from '$lib/constants/nodes'

interface FloatingControlsProps {
  onAddNode?: (node: FlowNode) => void
}

let nodeIdCounter = 0
const generateNodeId = () => `node_${++nodeIdCounter}_${Date.now()}`

export default memo(function FloatingControls({ onAddNode }: FloatingControlsProps) {
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const nodeTypes = getAllNodeTypes()

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as EventTarget & Node)) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [popoverOpen])

  const handleAddNodeType = (type: string) => {
    // screenToFlowPosition is valid here — inside ReactFlowProvider context
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })
    const newNode: FlowNode = {
      id: generateNodeId(),
      type,
      position,
      data: {
        ...getDefaultNodeData(type),
        mode: 'edit' as const,
      },
    }
    onAddNode?.(newNode)
    setPopoverOpen(false)
  }

  return (
    <>
      {/* + Add Node — bottom center */}
      <div
        ref={popoverRef}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        {/* Popover */}
        {popoverOpen && (
          <div className="mb-1 w-52 rounded-xl border border-white/10 bg-[#171717] shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Add Node
              </p>
            </div>
            <ul className="py-1">
              {nodeTypes.map(node => (
                <li key={node.type}>
                  <button
                    onClick={() => handleAddNodeType(node.type)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-slate-400">
                      {node.icon}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-slate-100 leading-none">
                        {node.label}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{node.typeLabel}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => setPopoverOpen(o => !o)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-semibold shadow-lg hover:opacity-90 transition-opacity select-none"
          style={{ background: 'var(--color-primary)' }}
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Node
        </button>
      </div>

      {/* Zoom controls — bottom right */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
        <button
          onClick={() => void zoomIn()}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#171717] border border-white/10 text-slate-400 hover:text-slate-100 transition-colors"
          title="Zoom In"
        >
          <span className="material-symbols-outlined text-sm">add</span>
        </button>
        <button
          onClick={() => void zoomOut()}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#171717] border border-white/10 text-slate-400 hover:text-slate-100 transition-colors"
          title="Zoom Out"
        >
          <span className="material-symbols-outlined text-sm">remove</span>
        </button>
        <button
          onClick={() => void fitView()}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#171717] border border-white/10 text-slate-400 hover:text-slate-100 transition-colors"
          title="Fit View"
        >
          <span className="material-symbols-outlined text-sm">center_focus_strong</span>
        </button>
      </div>
    </>
  )
})
