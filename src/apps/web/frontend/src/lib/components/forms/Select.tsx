import { forwardRef, useId, useState, useRef, useEffect } from 'react'
import type { SelectProps } from '$types/components/forms'
import Button from '../buttons/Button'
import Popover from '../surfaces/Popover'
import MS from '../display/MS'

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    options,
    value,
    onChange,
    onValueChange,
    presentation = 'native',
    placement = 'bottom-start',
    renderOption,
    placeholder = 'Select option…',
    disabled,
    size = 'md',
    className = '',
    id,
    ...props
  },
  ref
) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const selected = options.find(option => option.value === value)
  // aria-label alone would replace the trigger's content, hiding the selected value from its name.
  const labelId = props['aria-label'] && !props['aria-labelledby'] ? `${selectId}-label` : undefined
  const valueId = `${selectId}-value`
  const labelledBy = props['aria-labelledby'] ?? labelId
  const change = (next: string) => (onValueChange ?? onChange)?.(next)
  useEffect(() => {
    if (open) optionRefs.current[active]?.focus()
  }, [open, active])
  if (presentation === 'native')
    return (
      <select
        ref={ref}
        {...props}
        id={selectId}
        value={value}
        disabled={disabled}
        onChange={event => change(event.target.value)}
        className={`knik-input px-3 py-2 ${className}`}
      >
        {!selected && <option value={value}>{value || placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  const choose = (next: string) => {
    change(next)
    setOpen(false)
    triggerRef.current?.focus()
  }
  return (
    <Popover
      role="listbox"
      placement={placement}
      label={props['aria-label'] ?? 'Options'}
      autoFocus={false}
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (next)
          setActive(
            Math.max(
              0,
              options.findIndex(option => option.value === value)
            )
          )
      }}
      className={className}
      renderTrigger={triggerProps => (
        <Button
          {...triggerProps}
          ref={element => {
            triggerRef.current = element
            if (typeof triggerProps.ref === 'function') triggerProps.ref(element)
            else if (triggerProps.ref) triggerProps.ref.current = element
          }}
          id={selectId}
          variant="secondary"
          disabled={disabled || !options.length}
          size={size}
          aria-labelledby={labelledBy && `${labelledBy} ${valueId}`}
          aria-describedby={props['aria-describedby']}
          onKeyDown={event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              setActive(
                Math.max(
                  0,
                  options.findIndex(option => option.value === value)
                )
              )
            }
          }}
        >
          {labelId && (
            <span id={labelId} className="sr-only">
              {props['aria-label']}
            </span>
          )}
          <span id={valueId} className="min-w-0">
            {selected ? (renderOption?.(selected) ?? selected.label) : value || placeholder}
          </span>
          <MS name="expand_more" size={18} />
        </Button>
      )}
      content={
        <div
          onKeyDown={event => {
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
              event.preventDefault()
              setActive(index =>
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? options.length - 1
                    : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) %
                      options.length
              )
            }
          }}
        >
          {options.map((option, index) => (
            <Button
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              ref={element => {
                optionRefs.current[index] = element
              }}
              tabIndex={index === active ? 0 : -1}
              onClick={() => choose(option.value)}
              variant="ghost"
              className="w-full justify-start"
              size={size}
            >
              {renderOption?.(option) ?? option.label}
            </Button>
          ))}
        </div>
      }
    />
  )
})
export default Select
