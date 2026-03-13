import { useState } from 'react'
import type { ConfigurationFormProps } from '$types/sections/workflow-builder'
import { getNodeMetadata } from '$lib/constants/nodes'
import type { FormFieldConfig, FormFieldTip } from '$types/node-registry'

function TipBox({ tip }: { tip: FormFieldTip }) {
  return (
    <div className={`p-3 rounded-lg bg-${tip.color}-500/10 border border-${tip.color}-500/20`}>
      <div className={`flex items-center gap-2 text-${tip.color}-500 text-xs`}>
        <span className="material-symbols-outlined text-sm">{tip.icon}</span>
        <span className="font-medium">{tip.title}</span>
      </div>
      <p className="text-slate-400 text-[10px] mt-1">{tip.description}</p>
    </div>
  )
}

// ── Slider field ──────────────────────────────────────────────────────────────
function SliderField({
  field,
  value,
  onChange,
}: {
  field: FormFieldConfig
  value: unknown
  onChange: (value: number) => void
}) {
  const min = field.min ?? 0
  const max = field.max ?? 100
  const step = field.step ?? 1
  const numValue = typeof value === 'number' ? value : (field.defaultValue ?? min)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {field.label}
        </label>
        <span className="text-xs font-mono text-slate-100 tabular-nums">
          {step < 1 ? numValue.toFixed(1) : numValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numValue}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none bg-white/10 cursor-pointer accent-[#14b8a6]"
      />
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

// ── Tags field ────────────────────────────────────────────────────────────────
function TagsField({
  field,
  value,
  onChange,
}: {
  field: FormFieldConfig
  value: unknown
  onChange: (value: string[]) => void
}) {
  const [inputValue, setInputValue] = useState('')

  // Value is stored as string[] but arrives as unknown; normalise
  const tags: string[] = Array.isArray(value)
    ? (value as string[])
    : typeof value === 'string' && value
      ? (JSON.parse(value) as string[])
      : []

  const addTag = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInputValue('')
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag))
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {field.label}
      </label>
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-xs text-slate-100"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="text-slate-400 hover:text-slate-100 transition-colors leading-none"
            >
              <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            }
          }}
          placeholder={field.tagPlaceholder ?? 'Add...'}
          className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#14b8a6]/60 text-xs"
        />
        <button
          onClick={addTag}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors text-xs"
        >
          + Add
        </button>
      </div>
    </div>
  )
}

// ── Collapsible Textarea field ────────────────────────────────────────────────
function CollapsibleTextareaField({
  field,
  value,
  onChange,
}: {
  field: FormFieldConfig
  value: unknown
  onChange: (value: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {field.label}
        </label>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-slate-400 hover:text-slate-100 transition-colors"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          <span className="material-symbols-outlined text-[16px]">
            {expanded ? 'unfold_less' : 'unfold_more'}
          </span>
        </button>
      </div>
      <textarea
        value={String(value || '')}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={expanded ? 6 : 2}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#14b8a6]/60 resize-none text-xs transition-all duration-200"
      />
    </div>
  )
}

// ── Standard field (text / textarea / select / number) ───────────────────────
function StandardField({
  field,
  value,
  onChange,
}: {
  field: FormFieldConfig
  value: unknown
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {field.label}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          value={String(value || '')}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#14b8a6]/60 resize-none text-xs"
          rows={3}
        />
      ) : field.type === 'select' ? (
        <select
          value={String(value || '')}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[#171717] border border-white/10 text-slate-100 focus:outline-none focus:border-[#14b8a6]/60 text-xs"
        >
          {field.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type}
          value={String(value || '')}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#14b8a6]/60 text-xs"
        />
      )}
      {field.tip && <TipBox tip={field.tip} />}
    </div>
  )
}

// ── Main dispatcher ───────────────────────────────────────────────────────────
function FormField({
  field,
  value,
  onDataChange,
}: {
  field: FormFieldConfig
  value: unknown
  onDataChange: (field: string, value: unknown) => void
}) {
  if (field.type === 'slider') {
    return <SliderField field={field} value={value} onChange={v => onDataChange(field.field, v)} />
  }

  if (field.type === 'tags') {
    return <TagsField field={field} value={value} onChange={v => onDataChange(field.field, v)} />
  }

  if (field.type === 'textarea-collapsible') {
    return (
      <CollapsibleTextareaField
        field={field}
        value={value}
        onChange={v => onDataChange(field.field, v)}
      />
    )
  }

  return <StandardField field={field} value={value} onChange={v => onDataChange(field.field, v)} />
}

// ── Export ────────────────────────────────────────────────────────────────────
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
        <FormField
          key={field.field}
          field={field}
          value={data[field.field]}
          onDataChange={onDataChange}
        />
      ))}
    </div>
  )
}
