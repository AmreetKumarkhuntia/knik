/** Formats a millisecond duration into a human-readable string. */
export function formatDuration(ms: number | undefined): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

/** Formats an ISO date string into a locale-readable string. */
export function formatDate(date: string | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

/** Formats an ISO timestamp as Today / Yesterday / "Mon D" (empty string if null). */
export function formatRelativeDay(isoString: string | null): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
