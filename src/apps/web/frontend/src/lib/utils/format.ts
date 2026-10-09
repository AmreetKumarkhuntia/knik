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

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const DAY_MS = 24 * 60 * 60 * 1000
const CLOCK_SKEW_MS = 5 * 60 * 1000

function startOfLocalDay(time: number): number {
  const day = new Date(time)
  day.setHours(0, 0, 0, 0)
  return day.getTime()
}

/** Formats an ISO timestamp by local calendar day: Today, Yesterday or "Mon D" ("" if invalid). */
export function formatRelativeDay(isoString: string | null): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const time = date.getTime()
  if (Number.isNaN(time)) return ''
  const now = Date.now()
  // Timestamps from a server clock slightly ahead of ours still belong to today.
  if (time > now && time - now <= CLOCK_SKEW_MS) return 'Today'
  // Rounding absorbs the 23h and 25h days around daylight-saving changes.
  const diffDays = Math.round((startOfLocalDay(now) - startOfLocalDay(time)) / DAY_MS)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
