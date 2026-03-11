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
    <div className="p-6 space-y-6">
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-slate-100">Node Configuration</p>
        </div>
      </div>

      <ConfigurationForm
        nodeType={node.type || ''}
        data={localData}
        onDataChange={handleFieldChange}
      />
    </div>
  )
}
