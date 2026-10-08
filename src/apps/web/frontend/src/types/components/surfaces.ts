import type * as React from 'react'
import type { ReactNode } from 'react'

/** Available sizes for a modal dialog. */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

/** Props for a modal dialog. */
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  className?: string
  size?: ModalSize
  placement?: 'center' | 'left' | 'right'
  animationEnabled?: boolean
}

/** Props for a backdrop overlay. */
export interface BackdropProps {
  visible: boolean
  onClick: () => void
  opacity?: number
  className?: string
}

/** Props for a card container. */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'bordered' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

/** Props for a confirmation dialog. */
export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  loading?: boolean
}

export interface PopoverProps {
  renderTrigger: (
    props: React.ButtonHTMLAttributes<HTMLButtonElement> & { ref: React.Ref<HTMLButtonElement> }
  ) => React.ReactNode
  role?: 'dialog' | 'listbox' | 'menu'
  label?: string
  autoFocus?: boolean
  content: React.ReactNode
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export interface BannerProps {
  variant?: 'info' | 'warning' | 'danger' | 'success'
  dismissible?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  onDismiss?: () => void
}

export interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
}

export interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
  defaultOpen?: string[]
  className?: string
}
