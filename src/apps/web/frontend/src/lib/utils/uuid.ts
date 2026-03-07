export function generateId(prefix = ''): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}${crypto.randomUUID()}`
  }
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
