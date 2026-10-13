import { useId, useState } from 'react'
import { Chip, Input, MS, Select, Slider } from '$components'
import Button from '$components/buttons/Button'
import Textarea from '$components/forms/Textarea'
import type { ConfigurationFormProps } from '$types/sections/workflow-builder'
import type { NodeFieldProps } from '$types/node-registry'
import { getNodeMetadata } from '$lib/constants/nodes'

function TagsField({ field, value, onChange, draft = '', onDraftChange }: NodeFieldProps) {
  const id = useId()
  const tags = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
  const add = () => {
    const tag = draft.trim()
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    onDraftChange?.('')
  }
  return (
    <div>
      <label htmlFor={id} className="block text-label text-fg-3 mb-2">
        {field.label}
      </label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(tag => (
            <Chip
              key={tag}
              label={tag}
              variant="tag"
              onRemove={() => onChange(tags.filter(item => item !== tag))}
            />
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={event => onDraftChange?.(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault()
              add()
            }
          }}
          placeholder={field.tagPlaceholder ?? 'Add…'}
        />
        <Button variant="secondary" size="sm" className="rounded-[10px]" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  )
}

function NodeField({ field, value, onChange, draft, onDraftChange }: NodeFieldProps) {
  const id = useId()
  const tipId = `${id}-tip`
  const describedBy = field.tip ? tipId : undefined
  const [expanded, setExpanded] = useState(false)
  if (field.type === 'tags')
    return (
      <TagsField
        field={field}
        value={value}
        onChange={onChange}
        draft={draft}
        onDraftChange={onDraftChange}
      />
    )
  const text =
    typeof value === 'object' && value !== null
      ? JSON.stringify(value, null, 2)
      : String(value ?? '')
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label htmlFor={id} className="block text-label text-fg-3">
          {field.label}
        </label>
        {field.type === 'textarea-collapsible' && (
          <Button
            variant="ghost"
            size="sm"
            // Negative margin keeps the full touch target without stretching the label row.
            className="knik-btn--icon -my-2"
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
          id={id}
          min={field.min ?? 0}
          max={field.max ?? 100}
          step={field.step ?? 1}
          value={typeof value === 'number' ? value : (field.defaultValue ?? field.min ?? 0)}
          onChange={onChange}
        />
      ) : field.type === 'select' ? (
        <Select
          id={id}
          presentation="native"
          options={field.options ?? []}
          disabled={!field.options?.length}
          placeholder="No models available"
          value={text}
          onChange={onChange}
          aria-describedby={describedBy}
          className="w-full"
        />
      ) : field.type === 'textarea' || field.type === 'textarea-collapsible' ? (
        <Textarea
          id={id}
          value={text}
          onChange={event => onChange(event.target.value)}
          placeholder={field.placeholder}
          rows={field.type === 'textarea' ? 3 : expanded ? 6 : 2}
          aria-describedby={describedBy}
          className="py-2.5 font-mono text-body-sm resize-y"
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
          aria-describedby={describedBy}
        />
      )}
      {field.tip && (
        <p id={tipId} className="flex items-start gap-1.5 mt-2 text-caption text-fg-3">
          <MS name={field.tip.icon} size={15} className="shrink-0 mt-px text-[var(--acc-text)]" />
          <span>
            <span className="sr-only">{field.tip.title}:</span> {field.tip.description}
          </span>
        </p>
      )}
    </div>
  )
}

export default function ConfigurationForm({
  node,
  onUpdate,
  modelOptions,
  fieldDrafts,
  onFieldDraftChange,
}: ConfigurationFormProps) {
  const metadata = getNodeMetadata(node.type ?? '')
  if (!metadata) return null
  const { id: nodeId, data } = node
  return (
    <div className="flex flex-col gap-4">
      {metadata.formFields.map(field => (
        <NodeField
          key={field.field}
          field={field.field === 'model' ? { ...field, options: modelOptions } : field}
          draft={fieldDrafts[`${nodeId}:${field.field}`] ?? ''}
          onDraftChange={value => onFieldDraftChange(`${nodeId}:${field.field}`, value)}
          value={
            field.field === 'systemPrompt' ? (data.systemPrompt ?? data.prompt) : data[field.field]
          }
          onChange={value => onUpdate({ ...data, [field.field]: value })}
        />
      ))}
    </div>
  )
}
