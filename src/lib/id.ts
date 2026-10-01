let counter = 0

/** Compact, collision-resistant id that works in the browser and in tests. */
export function createId(prefix = 'id'): string {
  counter = (counter + 1) % 10_000
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`
}
