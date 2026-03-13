import { useState } from 'react'
import type { NodePropertiesProps } from '$types/sections/workflow-builder'
import ConfigurationForm from './ConfigurationForm'

export default function NodeProperties({ node, onUpdate }: NodePropertiesProps) {
  const [localData, setLocalData] = useState(node.data)

  const handleFieldChange = (field: string, value: unknown) => {
    const updatedData = { ...localData, [field]: value }
    setLocalData(updatedData)
    onUpdate(updatedData)
  }

  return (
    <div className="p-5 space-y-5">
      <ConfigurationForm
        nodeType={node.type || ''}
        data={localData}
        onDataChange={handleFieldChange}
      />
    </div>
  )
}
