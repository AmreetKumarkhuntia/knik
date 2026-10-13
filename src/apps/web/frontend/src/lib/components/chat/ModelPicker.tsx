import Select from '../forms/Select'
import type { ModelPickerProps } from '$types/components/chat'
import { MODEL_ACCENT_DOT } from '$lib/constants/componentMaps'

export default function ModelPicker({ model, onChange, compact, models }: ModelPickerProps) {
  return (
    <Select
      aria-label="Chat model"
      // Select owns the trigger and listbox markup, so the picker's skin reaches them through
      // descendant selectors. A compact trigger shows only the label (vendor and tag stay in the
      // list), and only the trigger's dot carries the halo.
      className={`min-w-0 max-w-full [@media(pointer:fine)_and_(min-width:768px)]:[&>button]:min-h-8 [&>button]:gap-2 [&>button]:px-2.5 [&>button]:rounded-[9px] [&>button]:bg-panel [&>button]:border-border-1 [&>button:hover:not(:disabled)]:!border-border-2 [&>button>span:last-child]:text-fg-4 [&>button_[data-model-dot]]:shadow-[0_0_0_3px_color-mix(in_srgb,currentColor_25%,transparent)] [&>[role=listbox]]:w-[300px] [&_[role=option]]:text-fg-1 ${compact ? '[&>button_[data-model-meta]]:hidden' : ''}`}
      presentation="rich"
      placement="top-start"
      options={models.map(option => ({ value: option.id, label: option.label }))}
      value={model}
      onValueChange={onChange}
      size={compact ? 'sm' : 'md'}
      placeholder={models.length ? 'Select a model' : 'No models available'}
      renderOption={option => {
        const detail = models.find(item => item.id === option.value)
        const dot = MODEL_ACCENT_DOT[detail?.badge ?? 'primary']
        return (
          <span className="flex w-full min-w-0 items-center gap-2.5 text-left">
            <span
              data-model-dot
              className="w-2 h-2 rounded-full shrink-0"
              style={{ color: dot, background: dot }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate max-w-[150px] sm:max-w-[200px] text-label">
                {option.label}
              </span>
              {detail?.vendor && (
                <span data-model-meta className="block text-caption text-fg-4">
                  {detail.vendor}
                </span>
              )}
            </span>
            {detail?.tag && (
              <span data-model-meta className="font-mono text-micro font-normal text-fg-4">
                {detail.tag}
              </span>
            )}
          </span>
        )
      }}
    />
  )
}
