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
    <aside className="w-72 border-r border-border bg-surfaceRaised/60 backdrop-blur-xl flex flex-col flex-shrink-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
          Node Properties
        </p>
        <p className="text-xs text-muted mt-0.5 truncate">
          {metadata ? `Configure your ${metadata.label} node` : 'Select a node to configure'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedNode ? (
          <NodeProperties
            key={selectedNode.id}
            node={selectedNode}
            onUpdate={data => onNodeUpdate(selectedNode.id, data)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center gap-3">
            <span className="material-symbols-outlined text-3xl text-muted">touch_app</span>
            <p className="text-xs text-muted leading-relaxed">
              Click a node on the canvas to view and edit its properties
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
