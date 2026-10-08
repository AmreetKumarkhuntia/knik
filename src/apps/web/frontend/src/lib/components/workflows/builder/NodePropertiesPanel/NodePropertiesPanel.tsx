import { Modal, MS } from '$components'
import Button from '$components/buttons/Button'
import { getNodeMetadata } from '$lib/constants/nodes'
import NodeProperties from '../PropertiesPanel/NodeProperties'
import type { NodePropertiesPanelProps } from '$types'

export default function NodePropertiesPanel({
  selectedNode,
  onNodeUpdate,
  compact = false,
  onClose,
  modelOptions,
  fieldDrafts,
  onFieldDraftChange,
}: NodePropertiesPanelProps) {
  if (!selectedNode) return null
  const metadata = getNodeMetadata(selectedNode.type ?? '')
  const properties = (
    <NodeProperties
      key={selectedNode.id}
      node={selectedNode}
      modelOptions={modelOptions}
      fieldDrafts={fieldDrafts}
      onFieldDraftChange={onFieldDraftChange}
      onUpdate={data => onNodeUpdate(selectedNode.id, data)}
    />
  )
  if (compact)
    return (
      <Modal isOpen placement="right" onClose={onClose} title="Node properties">
        {properties}
      </Modal>
    )
  return (
    <aside
      aria-label="Node properties"
      className="w-80 border-l border-border bg-surface flex flex-col flex-shrink-0 overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">Node properties</h2>
          <p className="text-xs text-secondary mt-1 truncate">
            {metadata?.label ?? selectedNode.type}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close node properties">
          <MS name="close" size={18} />
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">{properties}</div>
    </aside>
  )
}
