import type { FormFieldProps } from '$types/components'
import { FORM_FIELD_DEFAULTS, UI_TEXT, CSS_CLASSES } from '$lib/constants'

export default function FormField({
  label,
  type = FORM_FIELD_DEFAULTS.type,
  name,
  value,
  onChange,
  options,
  placeholder,
  required = FORM_FIELD_DEFAULTS.required,
  disabled = FORM_FIELD_DEFAULTS.disabled,
  className = FORM_FIELD_DEFAULTS.className,
}: FormFieldProps) {
  const inputClassName = CSS_CLASSES.input

  return (
    <div className={className}>
      {label && (
        <label className="block text-textSecondary text-sm mb-2">
          {label}
          {required && <span className="ml-1">{UI_TEXT.form.requiredIndicator}</span>}
        </label>
      )}
      {type === 'select' && options ? (
        <select
          name={name}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled}
          className={inputClassName}
          required={required}
        >
          <option value="">{placeholder || UI_TEXT.form.selectPlaceholder}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClassName}
          required={required}
        />
      )}
    </div>
  )
}
