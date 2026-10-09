import { useId, useState } from 'react'
import { Select } from '$components'
import Button from '$components/buttons/Button'
import { getNodeMetadata, getNodeTitle } from '$lib/constants/nodes'
import type { ConnectionFormProps } from '$types/sections/workflow-builder'

/** Keyboard alternative to dragging between node handles, which only respond to a pointer. */
export default function ConnectionForm({ node, nodes, onConnect }: ConnectionFormProps) {
  const id = useId()
  const [choice, setChoice] = useState('')
  const outputs = getNodeMetadata(node.type ?? '')?.handles.outputs ?? []
  const candidates = outputs.flatMap(output =>
    nodes.flatMap(target => {
      const input = getNodeMetadata(target.type ?? '')?.handles.inputs[0]
      if (target.id === node.id || !input) return []
      return [
        {
          value: `${output.id ?? ''}>${target.id}`,
          label: [output.label, getNodeTitle(target)].filter(Boolean).join(' → '),
          connection: {
            source: node.id,
            sourceHandle: output.id ?? null,
            target: target.id,
            targetHandle: input.id ?? null,
          },
        },
      ]
    })
  )
  if (!candidates.length) return null
  const selected = candidates.find(candidate => candidate.value === choice)
  return (
    <div className="px-5 pb-5 space-y-2">
      <label htmlFor={id} className="text-xs font-medium text-secondary uppercase tracking-wide">
        Connect to
      </label>
      <div className="flex gap-2">
        <Select
          id={id}
          value={choice}
          onChange={setChoice}
          options={candidates}
          placeholder="Choose a node…"
          className="flex-1 min-w-0 text-xs"
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={!selected}
          onClick={() => {
            if (!selected) return
            onConnect(selected.connection)
            setChoice('')
          }}
        >
          Connect
        </Button>
      </div>
    </div>
  )
}
