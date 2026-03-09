import { useState } from 'react'
import type { Node } from '@xyflow/react'
import ConfigurationForm from './ConfigurationForm'

interface NodePropertiesProps {
  node: Node
  onUpdate: (data: any) => void
}

export default function NodeProperties({ node, onUpdate }: NodePropertiesProps) {
  const [localData, setLocalData] = useState(node.data)

  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...localData, [field]: value }
    setLocalData(updatedData)
    onUpdate(updatedData)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-borderLight">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-purple/20 text-accent-purple">
          <span className="material-symbols-outlined">info</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-text">{node.type}</h3>
          <p className="text-[10px] text-textSecondary uppercase tracking-tighter">
            Node Configuration
          </p>
        </div>
      </div>

      <ConfigurationForm nodeType={node.type} data={localData} onDataChange={handleFieldChange} />
    </div>
  )
}
