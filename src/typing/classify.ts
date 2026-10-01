import type { ErrorCategory } from '@/types/typing'

/** Characters treated as punctuation for error categorisation. */
export const PUNCTUATION_CHARS = new Set([
  '.', ',', ';', ':', '!', '?', '"', "'", '(', ')', '[', ']', '{', '}', '-',
  '_', '/', '\\', '+', '=', '*', '&', '%', '$', '#', '@', '<', '>', '|', '~', '`', '^',
])

export interface ClassifyInput {
  expected: string
  typed: string
  index: number
  text: string
  /** expected char at index-1 (before this keystroke) */
  prevExpected: string | null
  /** char actually sitting at index-1 (before this keystroke) */
  prevTyped: string | null
  /** was the previous slot wrong */
  prevWrong: boolean
  /** errors already recorded for this word type in this session */
  priorWordErrors: number
}

/**
 * Categorises one wrong keystroke.
 *
 * Priority order (first match wins):
 *  1. transposition  — the previous slot holds our expected char and we typed theirs ("th" → "ht")
 *  2. capitalization — right letter, wrong case
 *  3. extra          — typed a non-space where a space was expected
 *  4. space          — typed a space where content was expected
 *  5. missing        — typed the character that belongs to the *next* position (skipped ahead)
 *  6. punctuation    — a punctuation key was expected
 *  7. number         — a digit key was expected
 *  8. repeated-word  — this word has already produced an error in this session
 *  9. wrong-key      — everything else
 */
export function classifyError(input: ClassifyInput): ErrorCategory {
  const { expected, typed, prevExpected, prevTyped, prevWrong, priorWordErrors, text, index } = input

  if (
    prevWrong &&
    prevTyped !== null &&
    prevExpected !== null &&
    prevTyped === expected &&
    typed === prevExpected &&
    prevTyped !== prevExpected
  ) {
    return 'transposition'
  }

  if (
    expected !== typed &&
    expected.length === 1 &&
    typed.length === 1 &&
    expected.toLowerCase() === typed.toLowerCase() &&
    /[a-z]/i.test(expected)
  ) {
    return 'capitalization'
  }

  if (expected === ' ') return 'extra'
  if (typed === ' ') return 'space'

  const next = text[index + 1]
  if (next !== undefined && next === typed && next !== expected) return 'missing'

  if (PUNCTUATION_CHARS.has(expected)) return 'punctuation'
  if (/[0-9]/.test(expected)) return 'number'
  if (priorWordErrors > 0) return 'repeated-word'

  return 'wrong-key'
}

export const ERROR_CATEGORY_LABEL: Record<ErrorCategory, string> = {
  'wrong-key': 'Wrong key',
  missing: 'Missing character',
  extra: 'Extra character',
  transposition: 'Transposition',
  'repeated-word': 'Repeated word',
  punctuation: 'Punctuation',
  capitalization: 'Capitalization',
  number: 'Number',
  space: 'Space',
  slow: 'Slow character',
}
