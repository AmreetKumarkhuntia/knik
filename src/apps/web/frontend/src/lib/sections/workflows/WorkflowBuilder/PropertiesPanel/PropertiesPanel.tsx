import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Node } from '@xyflow/react'
import NodeProperties from './NodeProperties'

interface PropertiesPanelProps {
  selectedNode: Node | null
  isOpen: boolean
  onClose: () => void
  onNodeUpdate: (nodeId: string, data: Record<string, unknown>) => void
}

export default function PropertiesPanel({
  selectedNode,
  isOpen,
  onClose,
  onNodeUpdate,
}: PropertiesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!isOpen) return null

  return (
    <motion.aside
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      exit={{ x: 320 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute right-0 top-0 bottom-0 w-80 border-l border-borderLight bg-surfaceGlass backdrop-blur-xl flex flex-col gradient-sidebar z-20"
    >
      <div className="flex items-center justify-between p-4 border-b border-borderLight">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-purple">settings</span>
          <h2 className="text-sm font-bold uppercase tracking-wider text-textSecondary">
            Properties
          </h2>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-textSecondary hover:text-text transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {selectedNode ? (
          <motion.div
            key="node-properties"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto"
          >
            <NodeProperties
              node={selectedNode}
              onUpdate={data => onNodeUpdate(selectedNode.id, data)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="no-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center p-6"
          >
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl text-textSecondary mb-3">
                select_window
              </span>
              <p className="text-sm text-textSecondary">Select a node to view its properties</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedNode && (
        <div className="p-4 border-t border-borderLight">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-textSecondary hover:text-text transition-colors text-sm"
          >
            <span className="material-symbols-outlined">
              {isExpanded ? 'unfold_less' : 'unfold_more'}
            </span>
            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>
      )}
    </motion.aside>
  )
}
