import type { ReactNode } from 'react'

/** Titled settings group (surface card + header block). */
export interface FormGroupProps {
  title: string
  sub?: string
  children: ReactNode
}

/** A labelled settings row: label/hint on the left, control on the right. */
export interface FormRowProps {
  htmlFor?: string
  hintId?: string
  label: string
  hint?: string
  children: ReactNode
  last?: boolean
}

/** Small mono section label. */
export interface EyebrowProps {
  children: ReactNode
}
