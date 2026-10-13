import { Modal, MS } from '$components'
import Button from '$components/buttons/Button'
import { getNodeMetadata } from '$lib/constants/nodes'
import ConfigurationForm from '../PropertiesPanel/ConfigurationForm'
import ConnectionForm from '../PropertiesPanel/ConnectionForm'
import type { NodePropertiesPanelProps } from '$types'

export default function NodePropertiesPanel({
  selectedNode,
  onNodeUpdate,
  compact = false,
  onClose,
  modelOptions,
  fieldDrafts,
  onFieldDraftChange,
  nodes,
  onConnect,
}: NodePropertiesPanelProps) {
  if (!selectedNode) return null
  const metadata = getNodeMetadata(selectedNode.type ?? '')
  const properties = (
    <>
      <div key={selectedNode.id} className="p-5 flex flex-col gap-4">
        <ConfigurationForm
          node={selectedNode}
          modelOptions={modelOptions}
          fieldDrafts={fieldDrafts}
          onFieldDraftChange={onFieldDraftChange}
          onUpdate={data => onNodeUpdate(selectedNode.id, data)}
        />
      </div>
      {nodes && onConnect && (
        <ConnectionForm
          key={`connect-${selectedNode.id}`}
          node={selectedNode}
          nodes={nodes}
          onConnect={onConnect}
        />
      )}
    </>
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
      className="w-80 bg-surface border-l border-border-1 flex flex-col flex-shrink-0 overflow-hidden knik-enter-drawer"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border-1">
        <div className="min-w-0">
          <h2 className="text-h3 text-fg-1">Node properties</h2>
          <p className="text-caption text-fg-3 mt-0.5 truncate">
            {metadata?.label ?? selectedNode.type} · {selectedNode.id}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="knik-btn--icon"
          onClick={onClose}
          aria-label="Close node properties"
        >
          <MS name="close" size={18} />
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">{properties}</div>
    </aside>
  )
}
