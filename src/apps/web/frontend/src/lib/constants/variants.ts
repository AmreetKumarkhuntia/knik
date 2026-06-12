/**
 * Style maps for shared component variants, built on the KNIK design-system
 * primitives in `styles/primitives.css`. Aurora cyan is the single accent.
 */

/** Button variant modifiers — pair with the base `knik-btn` class. */
export const buttonVariants = {
  primary: 'knik-btn--primary',
  secondary: 'knik-btn--secondary',
  danger: 'knik-btn--danger',
  ghost: 'knik-btn--ghost',
}

/** Button size modifiers — pair with the base `knik-btn` class. */
export const sizeVariants = {
  xs: 'knik-btn--xs',
  sm: 'knik-btn--sm',
  md: 'knik-btn--md',
  lg: 'knik-btn--lg',
}

/** Badge size modifiers — the design system caps badges at `md`. */
export const badgeSizes = {
  sm: 'knik-badge--sm',
  md: 'knik-badge--md',
  lg: 'knik-badge--md',
}

/** Spinner size modifiers — pair with the base `knik-spinner` class. */
export const spinnerSizes = {
  sm: 'knik-spinner--sm',
  md: 'knik-spinner--md',
  lg: 'knik-spinner--lg',
}

/** Confirm-dialog variants — icon + confirm-button styling per severity. */
export const confirmDialogVariants = {
  danger: { icon: '⚠', confirmBtn: 'bg-[var(--danger)] text-white hover:opacity-90' },
  warning: {
    icon: '⚡',
    confirmBtn: 'bg-[var(--warning)] text-[var(--fg-inverse)] hover:opacity-90',
  },
  info: { icon: 'ℹ', confirmBtn: 'bg-[var(--info)] text-white hover:opacity-90' },
}
