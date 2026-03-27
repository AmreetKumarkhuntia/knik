import type { NodeTypeName } from './workflow'

export interface HandleConfig {
  position: 'top' | 'bottom' | 'left' | 'right'
  id?: string // For conditional nodes: 'true', 'false'
  label?: string // Display label for handle
  color?: string // Tailwind color class for handle
  style?: Record<string, string> // Additional inline styles
}

export interface FormFieldTip {
  icon: string
  title: string
  description: string
  color: 'teal' | 'purple' | 'orange' | 'blue' | 'green' | 'red'
}

export interface FormFieldConfig {
  field: string
  label: string
  type: 'text' | 'textarea' | 'textarea-collapsible' | 'number' | 'select' | 'slider' | 'tags'
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  tip?: FormFieldTip
  // slider-specific
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  // tags-specific
  tagPlaceholder?: string
}

export interface NodeColors {
  primary: string
  iconBg: string // Tailwind class for icon background
  iconText: string // Tailwind class for icon color
  border: string
  hoverBorder: string
  neonBorder?: string
}

export interface NodeMetadata {
  type: NodeTypeName | 'StartNode' | 'EndNode'
  label: string
  typeLabel: string
  icon: string

  colors: NodeColors

  handles: {
    inputs: HandleConfig[]
    outputs: HandleConfig[]
  }

  defaultData: Record<string, unknown>
  formFields: FormFieldConfig[]

  isGradient?: boolean
  shape?: 'default' | 'pill'
  contentRenderer?: 'function' | 'conditional' | 'merge' | 'ai' | 'start' | 'end'
}

export type NodeRegistry = Partial<Record<string, NodeMetadata>>
