/** Formats a millisecond duration into a compact human-readable string. */
export function formatDuration(ms: number | undefined): string {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return '-'
  const rounded = Math.round(ms)
  if (rounded < 1000) return `${rounded}ms`
  // From 59.95s, toFixed(1) would print "60.0s".
  if (rounded < 59_950) return `${(rounded / 1000).toFixed(1)}s`
  const seconds = Math.round(ms / 1000)
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
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
