import type { FormFieldProps } from '$types/components'

export default function FormField({
  label,
  type = 'text',
  name,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
  className = '',
}: FormFieldProps) {
  const inputClassName =
    'w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all'

  return (
    <div className={className}>
      {label && (
        <label className="block text-white/70 text-sm mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
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
          <option value="">{placeholder || 'Select an option'}</option>
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
