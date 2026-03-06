export type ToastType = 'success' | 'error' | 'info'

export interface InputPanelProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}

export interface InputPanelRef {
  focus: () => void
  clear: () => void
}
