import type { NodePropertiesProps } from '$types/sections/workflow-builder'
import ConfigurationForm from './ConfigurationForm'

export default function NodeProperties({
  node,
  onUpdate,
  modelOptions,
  fieldDrafts,
  onFieldDraftChange,
}: NodePropertiesProps) {
  return (
    <div className="p-5 space-y-5">
      <ConfigurationForm
        nodeType={node.type ?? ''}
        nodeId={node.id}
        modelOptions={modelOptions}
        fieldDrafts={fieldDrafts}
        onFieldDraftChange={onFieldDraftChange}
        data={node.data}
        onDataChange={(field, value) => onUpdate({ ...node.data, [field]: value })}
      />
    </div>
  )
}
