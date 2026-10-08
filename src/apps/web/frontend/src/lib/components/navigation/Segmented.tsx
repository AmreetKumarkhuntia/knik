import { useId } from 'react'
import Radio from '../forms/Radio'
import type { SegmentedProps } from '$types'
export default function Segmented({ options, value, onChange, className }: SegmentedProps) {
  const name = useId()
  return (
    <Radio
      name={name}
      value={value}
      onChange={onChange}
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
