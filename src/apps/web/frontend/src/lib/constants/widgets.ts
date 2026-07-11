import type { CSSProperties } from 'react'

/** Background + foreground colors for each StatusPill tone. */
export const STATUS_PILL_TONES: Record<'success' | 'neutral', { bg: string; color: string }> = {
  success: { bg: 'var(--success-bg)', color: 'var(--success)' },
  neutral: { bg: 'rgba(154,166,182,0.16)', color: 'var(--fg-3)' },
}

/** Shared field styling for settings inputs/selects. */
export const SETTINGS_FIELD_STYLE: CSSProperties = {
  padding: '8px 11px',
  borderRadius: 'var(--r-btn, 8px)',
  border: '1px solid var(--border-2)',
  background: 'var(--bg-surface)',
  color: 'var(--fg-1)',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  outline: 'none',
  minWidth: 200,
}
