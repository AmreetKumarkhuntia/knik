import type { ConfigurationFormProps } from '$types/sections/workflow-builder'

export default function ConfigurationForm({
  nodeType,
  data,
  onDataChange,
}: ConfigurationFormProps) {
  const renderField = (
    label: string,
    field: string,
    type: 'text' | 'textarea' | 'number' | 'select' = 'text',
    options?: Array<{ value: string; label: string }>
  ) => {
    const value = data[field] ?? ''

    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-textSecondary uppercase">{label}</label>
        {type === 'textarea' ? (
          <textarea
            value={value as string}
            onChange={e => onDataChange(field, e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-borderLight text-text placeholder:text-textSecondary/50 focus:outline-none focus:border-accent-purple resize-none text-sm"
            rows={3}
          />
        ) : type === 'select' ? (
          <select
            value={value as string}
            onChange={e => onDataChange(field, e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-borderLight text-text focus:outline-none focus:border-accent-purple text-sm"
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value as string}
            onChange={e => onDataChange(field, e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-borderLight text-text placeholder:text-textSecondary/50 focus:outline-none focus:border-accent-purple text-sm"
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {nodeType === 'StartNode' && <>{renderField('Label', 'label', 'text')}</>}

      {nodeType === 'EndNode' && <>{renderField('Label', 'label', 'text')}</>}

      {nodeType === 'FunctionExecutionNode' && (
        <>
          {renderField('Function Name', 'function_name', 'text')}
          {renderField('Parameters (JSON)', 'params', 'textarea')}
        </>
      )}

      {nodeType === 'ConditionalBranchNode' && (
        <>
          {renderField('Condition', 'condition', 'text')}
          <div className="p-3 rounded-lg bg-accent-teal/10 border border-accent-teal/20">
            <div className="flex items-center gap-2 text-accent-teal text-xs">
              <span className="material-symbols-outlined text-sm">lightbulb</span>
              <span className="font-medium">Tip</span>
            </div>
            <p className="text-textSecondary text-[10px] mt-1">
              Use JavaScript expressions like{' '}
              <code className="px-1 py-0.5 bg-white/10 rounded">data.value &gt; 10</code>
            </p>
          </div>
        </>
      )}

      {nodeType === 'FlowMergeNode' && (
        <>
          {renderField('Merge Strategy', 'merge_strategy', 'select', [
            { value: 'concat', label: 'Concatenate' },
            { value: 'overwrite', label: 'Overwrite' },
          ])}
        </>
      )}

      {nodeType === 'AIExecutionNode' && (
        <>
          {renderField('Prompt', 'prompt', 'textarea')}
          {renderField('Model', 'model', 'select', [
            { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
            { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
          ])}
          {renderField('Temperature', 'temperature', 'number')}
          <div className="p-3 rounded-lg bg-accent-purple/10 border border-accent-purple/20">
            <div className="flex items-center gap-2 text-accent-purple text-xs">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span className="font-medium">AI Settings</span>
            </div>
            <p className="text-textSecondary text-[10px] mt-1">
              Temperature controls randomness. Lower = more focused, Higher = more creative.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
