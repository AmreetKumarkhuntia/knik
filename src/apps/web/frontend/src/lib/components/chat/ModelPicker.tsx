import Select from '../forms/Select'
import type { ModelPickerProps } from '$types/components/chat'
import type { SelectOption } from '$types/components/forms'
import { MODEL_ACCENT_DOT } from '$lib/constants/componentMaps'

export default function ModelPicker({ model, onChange, compact, models }: ModelPickerProps) {
  // The trigger gives its dot a halo, and a compact trigger drops the vendor and tag.
  const renderModel = (option: SelectOption, trigger = false) => {
    const detail = models.find(item => item.id === option.value)
    const dot = MODEL_ACCENT_DOT[detail?.badge ?? 'primary']
    const meta = !(trigger && compact)
    return (
      <span className="flex w-full min-w-0 items-center gap-2.5 text-left">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${trigger ? 'shadow-[0_0_0_3px_color-mix(in_srgb,currentColor_25%,transparent)]' : ''}`}
          style={{ color: dot, background: dot }}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate max-w-[150px] sm:max-w-[200px] text-label leading-[1.3]">
            {option.label}
          </span>
          {meta && detail?.vendor && (
            <span data-model-meta className="block text-caption leading-[1.25] text-fg-4">
              {detail.vendor}
            </span>
          )}
        </span>
        {meta && detail?.tag && (
          <span data-model-meta className="font-mono text-micro font-normal text-fg-4">
            {detail.tag}
          </span>
        )}
      </span>
    )
  }
  return (
    <Select
      aria-label="Chat model"
      className="min-w-0 max-w-full"
      triggerClassName="[@media(pointer:fine)_and_(min-width:768px)]:min-h-8 gap-2 px-2.5 rounded-[9px] bg-panel border-border-1 hover:!border-border-2"
      listClassName="w-[300px]"
      optionClassName="!py-1.5 !text-fg-1 [&[aria-selected=true]_[data-model-meta]]:!text-[var(--acc-meta)]"
      presentation="rich"
      placement="top-start"
      options={models.map(option => ({ value: option.id, label: option.label }))}
      value={model}
      onValueChange={onChange}
      size={compact ? 'sm' : 'md'}
      placeholder={models.length ? 'Select a model' : 'No models available'}
      renderOption={option => renderModel(option)}
      renderValue={option => renderModel(option, true)}
    />
  )
}
