import type { NodePropertiesProps } from '$types/sections/workflow-builder'
import ConfigurationForm from './ConfigurationForm'

export default function NodeProperties({ node, onUpdate }: NodePropertiesProps) {
  return (
    <div className="p-5 space-y-5">
      <ConfigurationForm
        nodeType={node.type ?? ''}
        data={node.data}
        onDataChange={(field, value) => onUpdate({ ...node.data, [field]: value })}
      />
    </div>
  )
}
