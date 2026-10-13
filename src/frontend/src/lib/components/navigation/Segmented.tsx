import { useId } from 'react'
import Radio from '../forms/Radio'
import type { SegmentedProps } from '$types'
export default function Segmented({ options, value, onChange, label, className }: SegmentedProps) {
  const name = useId()
  return (
    <Radio
      name={name}
      value={value}
      onChange={onChange}
      label={label}
      hideLabel
      className={className}
      presentation="segmented"
      options={options.map(option =>
        typeof option === 'string'
          ? { value: option, label: option }
          : {
              value: option.value,
              label: (
                <>
                  {option.icon}
                  {option.label}
                </>
              ),
            }
      )}
    />
  )
}
