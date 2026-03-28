/** Generates a unique ID with an optional prefix, using crypto.randomUUID when available. */
export function generateId(prefix = ''): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}${crypto.randomUUID()}`
  }
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
