import Select from '../forms/Select'
import type { ModelPickerProps } from '$types/components/chat'
import { MODEL_ACCENT_DOT } from '$lib/constants/componentMaps'

export default function ModelPicker({ model, onChange, compact, models }: ModelPickerProps) {
  return (
    <Select
      aria-label="Chat model"
      presentation="rich"
      options={models.map(option => ({ value: option.id, label: option.label }))}
      value={model}
      onValueChange={onChange}
      size={compact ? 'sm' : 'md'}
      placeholder={models.length ? 'Select a model' : 'No models available'}
      renderOption={option => {
        const detail = models.find(item => item.id === option.value)
        return (
          <span className="inline-flex items-center gap-2 text-left">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: MODEL_ACCENT_DOT[detail?.badge ?? 'primary'] }}
            />
            <span className="min-w-0">
              <span className="block text-sm">{option.label}</span>
              {detail?.vendor && !compact && (
                <span className="block text-xs text-fg-4">{detail.vendor}</span>
              )}
            </span>
            {detail?.tag && <span className="font-mono text-[10px] text-fg-4">{detail.tag}</span>}
          </span>
        )
      }}
    />
  )
}
