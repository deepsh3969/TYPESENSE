import { defaultRng, pickOne, type Rng } from '@/utils/random'

/** Collapses all whitespace runs to single spaces and trims. */
export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** Builds a space-joined text of exactly `count` words from the pool. */
export function buildWordText(pool: readonly string[], count: number, rng: Rng = defaultRng): string {
  if (pool.length === 0 || count <= 0) return ''
  const words: string[] = []
  let last = ''
  for (let i = 0; i < count; i++) {
    let word = pickOne(pool, rng)
    // avoid immediate repeats for a more natural rhythm
    if (word === last && pool.length > 1) {
      word = pickOne(pool, rng)
    }
    words.push(word)
    last = word
  }
  return words.join(' ')
}

/**
 * Builds text from phrase/sentence units until at least `minChars` characters
 * are reached (used for timed tests so fast typists never run out of text).
 */
export function buildTextToLength(units: readonly string[], minChars: number, rng: Rng = defaultRng): string {
  if (units.length === 0) return ''
  const parts: string[] = []
  let length = 0
  let guard = 0
  while (length < minChars && guard < 5000) {
    const unit = pickOne(units, rng)
    parts.push(unit.trim())
    length += unit.trim().length + 1
    guard++
  }
  return normalizeText(parts.join(' '))
}

/** Chars needed for a timed run at an assumed (generous) typing speed. */
export function charsForDuration(seconds: number): number {
  // assume up to ~150 WPM with safety margin → ~19 chars per second
  return Math.max(300, Math.ceil(seconds * 19))
}

/** Splits a text into words (without spaces) for word-level analysis. */
export function splitWords(text: string): string[] {
  return normalizeText(text).split(' ').filter(Boolean)
}

/**
 * Picks the next slice of text for a timed test when the typist reaches the
 * end of the current buffer: returns additional text to append.
 */
export function moreText(units: readonly string[], rng: Rng = defaultRng): string {
  return buildTextToLength(units, 600, rng)
}
