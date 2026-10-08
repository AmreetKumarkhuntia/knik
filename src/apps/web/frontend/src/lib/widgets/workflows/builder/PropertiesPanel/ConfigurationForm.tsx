import { useId, useState } from 'react'
import { Banner, Chip, Input, MS, Select, Slider } from '$components'
import Button from '$components/buttons/Button'
import Textarea from '$components/forms/Textarea'
import type { ConfigurationFormProps } from '$types/sections/workflow-builder'
import type { NodeFieldProps } from '$types/node-registry'
import { getNodeMetadata } from '$lib/constants/nodes'

function TagsField({ field, value, onChange }: NodeFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState('')
  const tags = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
  const add = () => {
    const tag = draft.trim()
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setDraft('')
  }
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-medium text-secondary uppercase tracking-wide">
        {field.label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <Chip
            key={tag}
            label={tag}
            variant="tag"
            onRemove={() => onChange(tags.filter(item => item !== tag))}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault()
              add()
            }
          }}
          placeholder={field.tagPlaceholder ?? 'Add…'}
          className="!px-3 !py-2 text-xs"
        />
        <Button variant="secondary" size="sm" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  )
}

function NodeField({ field, value, onChange }: NodeFieldProps) {
  const id = useId()
  const [expanded, setExpanded] = useState(false)
  if (field.type === 'tags') return <TagsField field={field} value={value} onChange={onChange} />
  const text =
    typeof value === 'object' && value !== null
      ? JSON.stringify(value, null, 2)
      : String(value ?? '')
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-secondary uppercase tracking-wide">
          {field.label}
        </label>
        {field.type === 'textarea-collapsible' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(current => !current)}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${field.label}`}
            aria-expanded={expanded}
          >
            <MS name={expanded ? 'unfold_less' : 'unfold_more'} size={16} />
          </Button>
        )}
      </div>
      {field.type === 'slider' ? (
        <Slider
          min={field.min ?? 0}
          max={field.max ?? 100}
          step={field.step ?? 1}
          value={typeof value === 'number' ? value : (field.defaultValue ?? field.min ?? 0)}
          onChange={onChange}
          label={field.label}
        />
      ) : field.type === 'select' ? (
        <Select
          id={id}
          presentation="native"
          options={field.options ?? []}
          value={text}
          onChange={onChange}
        />
      ) : field.type === 'textarea' || field.type === 'textarea-collapsible' ? (
        <Textarea
          id={id}
          value={text}
          onChange={event => onChange(event.target.value)}
          placeholder={field.placeholder}
          rows={field.type === 'textarea' ? 3 : expanded ? 6 : 2}
          className="w-full !px-3 !py-2 text-xs"
        />
      ) : (
        <Input
          id={id}
          type={field.type}
          value={text}
          onChange={event =>
            onChange(field.type === 'number' ? Number(event.target.value) : event.target.value)
          }
          placeholder={field.placeholder}
          className="!px-3 !py-2 text-xs"
        />
      )}
      {field.tip && (
        <Banner variant="info" icon={<MS name={field.tip.icon} size={16} />}>
          <span className="font-medium">{field.tip.title}</span>
          <p className="text-xs mt-1">{field.tip.description}</p>
        </Banner>
      )}
    </div>
  )
}

export default function ConfigurationForm({
  nodeType,
  data,
  onDataChange,
}: ConfigurationFormProps) {
  const metadata = getNodeMetadata(nodeType)
  if (!metadata) return null
  return (
    <div className="space-y-5">
      {metadata.formFields.map(field => (
        <NodeField
          key={field.field}
          field={field}
          value={
            field.field === 'systemPrompt' ? (data.systemPrompt ?? data.prompt) : data[field.field]
          }
          onChange={value => onDataChange(field.field, value)}
        />
      ))}
    </div>
  )
}
