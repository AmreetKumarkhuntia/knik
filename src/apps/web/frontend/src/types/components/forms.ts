import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from 'react'

/** Props for a text input field. */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  density?: 'compact' | 'comfortable'
  error?: string
  fullWidth?: boolean
  id?: string
}

/** Props for a toggle switch. */
export interface ToggleSwitchProps {
  id?: string
  name?: string
  'aria-label'?: string
  'aria-describedby'?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  className?: string
}

export interface CheckboxProps {
  presentation?: 'standard' | 'chip'
  id?: string
  name?: string
  'aria-describedby'?: string
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  disabled?: boolean
  indeterminate?: boolean
  className?: string
}

export interface RadioOption {
  label: ReactNode
  value: string
  monoLabel?: string
}

export interface RadioProps {
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  name: string
  presentation?: 'standard' | 'card' | 'chip' | 'segmented'
  label?: string
  disabled?: boolean
  className?: string
}

export interface SelectOption {
  label: string
  value: string
  icon?: string
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size' | 'value' | 'onChange' | 'children'
> {
  options: SelectOption[]
  value: string
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
  presentation?: 'native' | 'rich'
  renderOption?: (option: SelectOption) => ReactNode
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface SliderProps {
  id?: string
  name?: string
  disabled?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
  formatValue?: (value: number) => string
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  step?: number
  label?: string
  className?: string
}

export interface FileUploadProps {
  accept?: string
  multiple?: boolean
  onUpload: (files: File[]) => void
  maxSize?: number // in bytes
  className?: string
}

/** Props for a search bar input. */
export interface SearchBarProps {
  placeholder?: string
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}
