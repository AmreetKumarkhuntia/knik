import type { NodeTypeName } from './workflow'

/** Configuration for a node's input or output handle. */
export interface HandleConfig {
  position: 'top' | 'bottom' | 'left' | 'right'
  id?: string
  label?: string
  color?: string
  style?: Record<string, string>
}

/** A contextual tip displayed alongside a form field. */
export interface FormFieldTip {
  icon: string
  title: string
  description: string
  color: 'teal' | 'purple' | 'orange' | 'blue' | 'green' | 'red'
}

/** Configuration for a single form field in the node editor. */
export interface FormFieldConfig {
  field: string
  label: string
  type: 'text' | 'textarea' | 'textarea-collapsible' | 'number' | 'select' | 'slider' | 'tags'
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  tip?: FormFieldTip
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  tagPlaceholder?: string
}

/** Tailwind color classes for a node type. */
export interface NodeColors {
  primary: string
  iconBg: string
  iconText: string
  border: string
  hoverBorder: string
  neonBorder?: string
}

/** Full metadata describing a registered node type. */
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

/** Registry mapping node type names to their metadata. */
export type NodeRegistry = Partial<Record<string, NodeMetadata>>
