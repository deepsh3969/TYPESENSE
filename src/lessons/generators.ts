import type { ProblemKey, ProblemPattern, WordStat } from '@/types/analytics'
import type { PracticeModeId } from '@/types/profile'
import {
  COMMON_WORDS,
  NUMBER_TOKENS,
  PUNCTUATION_TOKENS,
  TECHNICAL_TOKENS,
  TRICKY_WORDS,
} from '@/data/words'
import { DRILL_WORDS, MEDIUM_PASSAGES, SENTENCES, SHORT_PASSAGES } from '@/data/passages'
import { normalizeText } from '@/typing/text'
import { defaultRng, pickOne, shuffle, type Rng } from '@/utils/random'

/** Everything the adaptive generators can draw from. */
export interface PracticeContext {
  problemKeys: ProblemKey[]
  bigrams: ProblemPattern[]
  substitutions: ProblemPattern[]
  transpositions: ProblemPattern[]
  weakWords: WordStat[]
  customText?: string
}

const VOWELS = 'aeiou'
const BRIDGES = ['t', 'r', 's', 'n', 'l']

function wordsContaining(char: string, limit: number, rng: Rng): string[] {
  const pool = [...new Set([...DRILL_WORDS, ...TRICKY_WORDS, ...COMMON_WORDS])]
  const matches = pool.filter((w) => w.includes(char) && w.length >= 3 && w.length <= 9)
  return shuffle(matches, rng).slice(0, limit)
}

function wordsWithGram(gram: string, limit: number, rng: Rng): string[] {
  const pool = [...new Set([...DRILL_WORDS, ...TRICKY_WORDS, ...COMMON_WORDS])]
  const matches = pool.filter((w) => w.includes(gram.toLowerCase()))
  return shuffle(matches, rng).slice(0, limit)
}

function sentencesWith(fragment: string, limit: number, rng: Rng): string[] {
  const matches = SENTENCES.filter((s) => s.toLowerCase().includes(fragment.toLowerCase()))
  if (matches.length >= limit) return shuffle(matches, rng).slice(0, limit)
  return matches
}

// ────────────────────────────────────────────────────────────── key drill

/**
 * Builds a drill for one weak key — pattern rows first, then real words, then
 * sentences: e.g. `r →` "rtr trt rtree true treat track street target".
 */
export function generateKeyDrill(key: string, rng: Rng = defaultRng): string {
  const k = key.toLowerCase()

  if (/^[0-9]$/.test(k)) {
    const tokens: string[] = []
    for (let i = 0; i < 24; i++) {
      tokens.push(pickOne(NUMBER_TOKENS, rng), pickOne(NUMBER_TOKENS, rng))
    }
    return normalizeText(`digit ${k}: ${k} ${k} ${k} ${k} ${tokens.join(' ')} reference 4821 cell 77-3x`)
  }

  if (!/^[a-z]$/.test(k)) {
    const p = PUNCTUATION_TOKENS
    const row = Array.from({ length: 14 }, () => `${pickOne(p, rng)}${pickOne(p, rng)}`).join(' ')
    return normalizeText(`symbol ${k}: ${k} ${k} ${k} ${row} ${pickOne(SENTENCES, rng)}`)
  }

  const pairs: string[] = []
  for (const v of VOWELS) {
    pairs.push(`${k}${v}`)
    pairs.push(`${v}${k}`)
  }
  const triples: string[] = []
  for (const b of BRIDGES) {
    if (b === k) continue
    triples.push(`${k}${b}${k}`)
    triples.push(`${b}${k}${b}`)
  }

  const words = wordsContaining(k, 10, rng)
  const sents = sentencesWith(k, 2, rng)

  const parts = [
    shuffle(pairs, rng).join(' '),
    shuffle(triples, rng).slice(0, 8).join(' '),
    words.join(' '),
    words.slice(0, 5).reverse().join(' '),
    ...sents,
  ].filter(Boolean)

  return normalizeText(parts.join(' '))
}

// ───────────────────────────────────────────────────── combination drills

/** Weak bigram/trigram drill: the gram isolated, then in real words. */
export function generateCombinationDrill(pattern: ProblemPattern, rng: Rng = defaultRng): string {
  const gram = pattern.expected.toLowerCase()

  if (pattern.kind === 'substitution') {
    const e = pattern.expected.toLowerCase()
    const a = (pattern.actual || '').toLowerCase()
    const tokens = [`${e}${a}${e}`, `${a}${e}${a}`, `${e}${a}`, `${a}${e}`]
    const words = wordsContaining(e, 8, rng)
    return normalizeText(
      [
        shuffle(tokens, rng).join(' '),
        shuffle(tokens, rng).join(' '),
        words.join(' '),
        words.slice(0, 4).reverse().join(' '),
        ...sentencesWith(e, 2, rng),
      ].join(' '),
    )
  }

  if (pattern.kind === 'transposition') {
    const reversed = gram.split('').reverse().join('')
    const words = wordsWithGram(gram, 8, rng)
    const row = Array.from({ length: 6 }, () => `${gram} ${reversed}`).join(' ')
    return normalizeText([row, words.join(' '), ...sentencesWith(gram, 2, rng)].join(' '))
  }

  // bigram / trigram
  const words = wordsWithGram(gram, 10, rng)
  const isolation = `${gram} ${gram} ${gram}`
  const sents = sentencesWith(gram, 2, rng)
  return normalizeText(
    [
      `${isolation} ${words.slice(0, 5).join(' ')}`,
      words.join(' '),
      `${isolation} ${words.slice(5).join(' ')}`,
      ...sents,
    ].filter(Boolean).join(' '),
  )
}

// ──────────────────────────────────────────────────────── word drill

export function generateWordDrill(words: string[], rng: Rng = defaultRng): string {
  const clean = words.filter(Boolean).slice(0, 8)
  if (clean.length === 0) return generateSpeedDrill(rng)
  const reps = shuffle([...clean, ...clean, ...clean], rng)
  const fillers = shuffle(DRILL_WORDS, rng).slice(0, 6)
  const sents = SENTENCES.filter((s) => clean.some((w) => s.toLowerCase().includes(w))).slice(0, 2)
  return normalizeText([reps.join(' '), fillers.join(' '), ...sents].join(' '))
}

// ───────────────────────────────────────────────────── fixed-mode drills

export function generateSpeedDrill(rng: Rng = defaultRng): string {
  const short = shuffle(
    COMMON_WORDS.filter((w) => w.length >= 3 && w.length <= 7),
    rng,
  ).slice(0, 36)
  const sents = shuffle(SENTENCES, rng).slice(0, 3)
  return normalizeText([short.join(' '), ...sents].join(' '))
}

export function generateAccuracyDrill(rng: Rng = defaultRng): string {
  const tricky = shuffle(TRICKY_WORDS, rng).slice(0, 10)
  const sents = shuffle(SENTENCES, rng).slice(0, 4)
  return normalizeText([tricky.join(' '), ...sents].join(' '))
}

export function generatePunctuationDrill(rng: Rng = defaultRng): string {
  const row = Array.from({ length: 10 }, () =>
    PUNCTUATION_TOKENS.map((p) => p).join(' '),
  ).join(' ')
  const sents = shuffle(SENTENCES, rng).slice(0, 5)
  return normalizeText([
    '. , ; : ! ? " ( ) -',
    row,
    'She said, "yes" (really!) — then paused; he answered: "wait, please?"',
    ...sents,
  ].join(' '))
}

export function generateNumberDrill(rng: Rng = defaultRng): string {
  const tokens: string[] = []
  for (let i = 0; i < 30; i++) {
    tokens.push(pickOne(NUMBER_TOKENS, rng))
    tokens.push(pickOne(NUMBER_TOKENS, rng))
  }
  return normalizeText([
    '0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15',
    tokens.join(' '),
    'Order 5 boxes of 24 units each; total 120; invoice #4821; due 12/04/2026.',
    'Batch 9F-2048 shipped 760 units on 03/17 at 14:20, covering orders #55120 through #55196.',
  ].join(' '))
}

export function generateFlowDrill(rng: Rng = defaultRng): string {
  const a = pickOne(MEDIUM_PASSAGES, rng)
  const b = pickOne(SHORT_PASSAGES, rng)
  return normalizeText(`${a} ${b}`)
}

export function generateTechnicalDrill(rng: Rng = defaultRng): string {
  const tokens = shuffle(TECHNICAL_TOKENS, rng).slice(0, 20)
  return normalizeText([
    tokens.join(' '),
    'The scheduler queues each request, measures its latency, and writes the result to a rolling index kept in memory.',
    ...shuffle(TECHNICAL_TOKENS, rng).slice(0, 12),
  ].join(' '))
}

/**
 * Precision drill: seeded with the learner's own weak keys and combinations so
 * every line attacks a known failure point.
 */
export function generatePrecisionDrill(ctx: PracticeContext, rng: Rng = defaultRng): string {
  const parts: string[] = []
  for (const pattern of [...ctx.substitutions, ...ctx.transpositions].slice(0, 2)) {
    parts.push(generateCombinationDrill(pattern, rng))
  }
  for (const key of ctx.problemKeys.slice(0, 2)) {
    parts.push(generateKeyDrill(key.key, rng))
  }
  if (ctx.weakWords.length > 0) {
    parts.push(generateWordDrill(ctx.weakWords.map((w) => w.word), rng))
  }
  if (parts.length === 0) return generateAccuracyDrill(rng)
  return normalizeText(parts.slice(0, 3).join(' '))
}

export function generateCustomDrill(text: string): string {
  return normalizeText(text)
}

/** Entry point used by the Practice page. */
export function generatePracticeText(mode: PracticeModeId, ctx: PracticeContext): string {
  const rng = defaultRng
  switch (mode) {
    case 'problem-keys': {
      const key = ctx.problemKeys[0]?.key
      return key ? generateKeyDrill(key, rng) : generateSpeedDrill(rng)
    }
    case 'combinations': {
      const pattern = ctx.bigrams[0] ?? ctx.transpositions[0] ?? ctx.substitutions[0]
      return pattern ? generateCombinationDrill(pattern, rng) : generateSpeedDrill(rng)
    }
    case 'weak-words':
      return generateWordDrill(ctx.weakWords.map((w) => w.word), rng)
    case 'speed-drill':
      return generateSpeedDrill(rng)
    case 'accuracy-drill':
      return generateAccuracyDrill(rng)
    case 'precision':
      return generatePrecisionDrill(ctx, rng)
    case 'flow':
      return generateFlowDrill(rng)
    case 'punctuation':
      return generatePunctuationDrill(rng)
    case 'numbers':
      return generateNumberDrill(rng)
    case 'custom':
      return generateCustomDrill(ctx.customText ?? '')
    default:
      return generateSpeedDrill(rng)
  }
}

/** Drill label shown on the practice header. */
export function practiceFocusLabel(mode: PracticeModeId, ctx: PracticeContext): string {
  switch (mode) {
    case 'problem-keys':
      return ctx.problemKeys[0] ? `Key: ${ctx.problemKeys[0].key.toUpperCase()}` : 'Mixed keys'
    case 'combinations':
      return ctx.bigrams[0] ? `Pair: ${ctx.bigrams[0].expected.toUpperCase()}` : 'Common pairs'
    case 'weak-words':
      return ctx.weakWords[0] ? `Words: ${ctx.weakWords.slice(0, 3).map((w) => w.word).join(', ')}` : 'Common words'
    case 'custom':
      return 'Your text'
    default:
      return mode.replace(/-/g, ' ')
  }
}
