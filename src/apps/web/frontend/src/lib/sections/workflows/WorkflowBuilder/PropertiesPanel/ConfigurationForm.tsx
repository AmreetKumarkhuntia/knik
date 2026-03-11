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
      <p className="text-textSecondary text-[10px] mt-1">{tip.description}</p>
    </div>
  )
}

function FormField({
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
      <label className="text-xs font-medium text-textSecondary uppercase">{field.label}</label>
      {field.type === 'textarea' ? (
        <textarea
          value={String(value || '')}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-borderLight text-text placeholder:text-textSecondary/50 focus:outline-none focus:border-accent-purple resize-none text-sm"
          rows={3}
        />
      ) : field.type === 'select' ? (
        <select
          value={String(value || '')}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-borderLight text-text focus:outline-none focus:border-accent-purple text-sm"
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
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-borderLight text-text placeholder:text-textSecondary/50 focus:outline-none focus:border-accent-purple text-sm"
        />
      )}
      {field.tip && <TipBox tip={field.tip} />}
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
    <div className="space-y-4">
      {metadata.formFields.map(field => (
        <FormField
          key={field.field}
          field={field}
          value={data[field.field]}
          onChange={value => onDataChange(field.field, value)}
        />
      ))}
    </div>
  )
}
