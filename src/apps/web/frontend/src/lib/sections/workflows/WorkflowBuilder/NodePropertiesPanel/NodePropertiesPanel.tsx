import type { Node } from '@xyflow/react'
import { getNodeMetadata } from '$lib/constants/nodes'
import NodeProperties from '../PropertiesPanel/NodeProperties'

interface NodePropertiesPanelProps {
  selectedNode: Node | null
  onNodeUpdate: (nodeId: string, data: Record<string, unknown>) => void
}

export default function NodePropertiesPanel({
  selectedNode,
  onNodeUpdate,
}: NodePropertiesPanelProps) {
  const metadata = selectedNode ? getNodeMetadata(selectedNode.type ?? '') : null

  return (
    <aside className="w-72 border-r border-white/10 bg-[#171717] flex flex-col flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Node Properties
        </p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {metadata ? `Configure your ${metadata.label} node` : 'Select a node to configure'}
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {selectedNode ? (
          <NodeProperties
            key={selectedNode.id}
            node={selectedNode}
            onUpdate={data => onNodeUpdate(selectedNode.id, data)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center gap-3">
            <span className="material-symbols-outlined text-3xl text-slate-600">touch_app</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Click a node on the canvas to view and edit its properties
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
