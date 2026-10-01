import type { ProblemPattern, WordStat } from '@/types/analytics'
import type { ErrorCategory, SessionLike, TypingError } from '@/types/typing'
import { physicalKey } from '@/typing/engine'

interface Occurrence {
  word: string
  start: number
  end: number
}

export function wordOccurrences(text: string): Occurrence[] {
  const out: Occurrence[] = []
  let i = 0
  while (i < text.length) {
    if (text[i] === ' ') {
      i++
      continue
    }
    const start = i
    while (i < text.length && text[i] !== ' ') i++
    out.push({ word: text.slice(start, i), start, end: i })
  }
  return out
}

/** Positions with a real mistake (slow records excluded). */
function mistakePositions(session: SessionLike): Map<number, TypingError> {
  const map = new Map<number, TypingError>()
  for (const e of session.errors) {
    if (e.category === 'slow') continue
    const existing = map.get(e.position)
    if (!existing) map.set(e.position, e)
    else if (existing.corrected && !e.corrected) map.set(e.position, e)
  }
  return map
}

function dominantCategory(errors: TypingError[]): ErrorCategory {
  const counts = new Map<ErrorCategory, number>()
  for (const e of errors) counts.set(e.category, (counts.get(e.category) ?? 0) + 1)
  let best: ErrorCategory = 'wrong-key'
  let bestCount = 0
  for (const [cat, count] of counts) {
    if (cat === 'slow') continue
    if (count > bestCount) {
      best = cat
      bestCount = count
    }
  }
  return best
}

function confidenceOf(attempts: number): number {
  return attempts <= 0 ? 0 : Math.round((1 - Math.exp(-attempts / 40)) * 100) / 100
}

// --------------------------------------------------------------------- words

/**
 * Word-level accuracy: an occurrence is "broken" when any position inside it
 * (plus its terminating space) carries a mistake.
 */
export function analyzeWords(sessions: readonly SessionLike[]): WordStat[] {
  const stats = new Map<string, { attempts: number; errors: number }>()
  const errorTimes = new Map<string, { sum: number; count: number }>()

  for (const session of sessions) {
    const mistakes = mistakePositions(session)

    for (const e of session.errors) {
      if (e.category === 'slow') continue
      const t = errorTimes.get(e.word) ?? { sum: 0, count: 0 }
      t.sum += e.timeToTypeMs
      t.count++
      errorTimes.set(e.word, t)
    }

    for (const occ of wordOccurrences(session.text)) {
      let st = stats.get(occ.word)
      if (!st) {
        st = { attempts: 0, errors: 0 }
        stats.set(occ.word, st)
      }
      st.attempts++
      let broken = false
      for (let p = occ.start; p <= occ.end; p++) {
        if (p === occ.end && occ.end < session.text.length && session.text[occ.end] !== ' ') continue
        if (mistakes.has(p)) {
          broken = true
          break
        }
      }
      if (broken) st.errors++
    }
  }

  const out: WordStat[] = []
  for (const [word, st] of stats) {
    const t = errorTimes.get(word)
    out.push({
      word,
      attempts: st.attempts,
      errors: st.errors,
      accuracy: st.attempts > 0 ? Math.round((1 - st.errors / st.attempts) * 1000) / 10 : 100,
      // mean duration of mistyped keystrokes inside this word (0 = never mistyped)
      avgTimeMs: t && t.count > 0 ? Math.round(t.sum / t.count) : 0,
    })
  }
  out.sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors || b.attempts - a.attempts)
  return out
}

/** Words worth practising: enough evidence, meaningful failure rate. */
export function weakWords(words: readonly WordStat[], limit = 8): WordStat[] {
  return words.filter((w) => w.attempts >= 2 && w.errors >= 1 && w.accuracy < 92).slice(0, limit)
}

// ------------------------------------------------------------------ n-grams

interface NgramStat {
  attempts: number
  broken: number
  errorDelays: number[]
  errors: TypingError[]
}

/**
 * N-gram accuracy (bigrams / trigrams). An occurrence counts as broken when any
 * of its positions carries a mistake. Whitespace-free grams only — word-level
 * failures are handled by analyzeWords.
 */
export function analyzeNgrams(sessions: readonly SessionLike[], size: 2 | 3): ProblemPattern[] {
  const stats = new Map<string, NgramStat>()

  for (const session of sessions) {
    const mistakes = mistakePositions(session)
    const text = session.text
    for (let i = 0; i + size <= text.length; i++) {
      const gram = text.slice(i, i + size)
      if (gram.includes(' ')) continue
      let st = stats.get(gram)
      if (!st) {
        st = { attempts: 0, broken: 0, errorDelays: [], errors: [] }
        stats.set(gram, st)
      }
      st.attempts++
      let hit = false
      for (let j = i; j < i + size; j++) {
        const err = mistakes.get(j)
        if (err) {
          hit = true
          st.errors.push(err)
          st.errorDelays.push(err.timeToTypeMs)
        }
      }
      if (hit) st.broken++
    }
  }

  const patterns: ProblemPattern[] = []
  for (const [gram, st] of stats) {
    if (st.attempts < 4 || st.broken === 0) continue
    const accuracy = Math.round((1 - st.broken / st.attempts) * 1000) / 10
    patterns.push({
      id: `${size === 2 ? 'bigram' : 'trigram'}:${gram}`,
      kind: size === 2 ? 'bigram' : 'trigram',
      expected: gram,
      actual: '',
      attempts: st.attempts,
      errors: st.broken,
      accuracy,
      avgDelayMs: st.errorDelays.length
        ? Math.round(st.errorDelays.reduce((a, b) => a + b, 0) / st.errorDelays.length)
        : 0,
      confidence: confidenceOf(st.attempts),
      recommendation: `Practise ${gram.toUpperCase()} combinations`,
      category: dominantCategory(st.errors),
    })
  }

  patterns.sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors)
  return patterns
}

// ----------------------------------------------------------- substitutions

/** Expected → typed confusions, e.g. r → t (18 times). */
export function analyzeSubstitutions(
  sessions: readonly SessionLike[],
  keyAttempts: ReadonlyMap<string, number>,
): ProblemPattern[] {
  const groups = new Map<string, { expected: string; typed: string; errors: TypingError[] }>()

  for (const session of sessions) {
    for (const e of session.errors) {
      if (e.category === 'slow') continue
      if (e.category === 'transposition') continue
      if (e.expected.length !== 1 || e.typed.length !== 1 || e.expected === e.typed) continue
      const key = `${e.expected}→${e.typed}`
      let g = groups.get(key)
      if (!g) {
        g = { expected: e.expected, typed: e.typed, errors: [] }
        groups.set(key, g)
      }
      g.errors.push(e)
    }
  }

  const patterns: ProblemPattern[] = []
  for (const [key, g] of groups) {
    const attempts = keyAttempts.get(physicalKey(g.expected)) ?? 0
    if (g.errors.length < 2 || attempts < 6) continue
    const accuracy = Math.max(0, Math.round((1 - g.errors.length / attempts) * 1000) / 10)
    patterns.push({
      id: `substitution:${key}`,
      kind: 'substitution',
      expected: g.expected,
      actual: g.typed,
      attempts,
      errors: g.errors.length,
      accuracy,
      avgDelayMs: Math.round(g.errors.reduce((a, e) => a + e.timeToTypeMs, 0) / g.errors.length),
      confidence: confidenceOf(attempts),
      recommendation: `Work on ${g.expected.toUpperCase()} — you often reach for ${g.typed.toUpperCase()}`,
      category: dominantCategory(g.errors),
    })
  }
  patterns.sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors)
  return patterns
}

// ------------------------------------------------------------ transpositions

/** Pair reversals like th → ht. */
export function analyzeTranspositions(sessions: readonly SessionLike[]): ProblemPattern[] {
  const groups = new Map<string, { pair: string; errors: TypingError[] }>()
  const occurrences = new Map<string, number>()

  for (const session of sessions) {
    const text = session.text
    for (let i = 0; i + 1 < text.length; i++) {
      const pair = text.slice(i, i + 2)
      if (pair.includes(' ')) continue
      occurrences.set(pair, (occurrences.get(pair) ?? 0) + 1)
    }
    for (const e of session.errors) {
      if (e.category !== 'transposition') continue
      if (e.position < 1) continue
      const pair = text.slice(e.position - 1, e.position + 1)
      if (pair.length !== 2 || pair.includes(' ')) continue
      let g = groups.get(pair)
      if (!g) {
        g = { pair, errors: [] }
        groups.set(pair, g)
      }
      g.errors.push(e)
    }
  }

  const patterns: ProblemPattern[] = []
  for (const [pair, g] of groups) {
    const attempts = occurrences.get(pair) ?? 0
    if (attempts < 4) continue
    const accuracy = Math.max(0, Math.round((1 - g.errors.length / attempts) * 1000) / 10)
    patterns.push({
      id: `transposition:${pair}`,
      kind: 'transposition',
      expected: pair,
      actual: pair.split('').reverse().join(''),
      attempts,
      errors: g.errors.length,
      accuracy,
      avgDelayMs: Math.round(g.errors.reduce((a, e) => a + e.timeToTypeMs, 0) / g.errors.length),
      confidence: confidenceOf(attempts),
      recommendation: `Slow down on ${pair.toUpperCase()} — you typed ${pair.split('').reverse().join('')}`,
      category: 'transposition',
    })
  }
  patterns.sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors)
  return patterns
}

// ------------------------------------------------------------------- affixes

function analyzeAffix(
  sessions: readonly SessionLike[],
  kind: 'prefix' | 'suffix',
): ProblemPattern[] {
  const stats = new Map<string, { attempts: number; broken: number; errors: TypingError[] }>()

  for (const session of sessions) {
    const mistakes = mistakePositions(session)
    for (const occ of wordOccurrences(session.text)) {
      if (occ.word.length < 3) continue
      const affix =
        kind === 'prefix' ? occ.word.slice(0, 2) : occ.word.slice(occ.word.length - 2)
      const from = kind === 'prefix' ? occ.start : occ.end - 2
      const to = kind === 'prefix' ? occ.start + 2 : occ.end
      let st = stats.get(affix)
      if (!st) {
        st = { attempts: 0, broken: 0, errors: [] }
        stats.set(affix, st)
      }
      st.attempts++
      for (let p = from; p < to; p++) {
        const err = mistakes.get(p)
        if (err) {
          st.broken++
          st.errors.push(err)
          break
        }
      }
    }
  }

  const patterns: ProblemPattern[] = []
  for (const [affix, st] of stats) {
    if (st.attempts < 5 || st.broken === 0) continue
    const accuracy = Math.round((1 - st.broken / st.attempts) * 1000) / 10
    patterns.push({
      id: `${kind}:${affix}`,
      kind,
      expected: affix,
      actual: '',
      attempts: st.attempts,
      errors: st.broken,
      accuracy,
      avgDelayMs: st.errors.length
        ? Math.round(st.errors.reduce((a, e) => a + e.timeToTypeMs, 0) / st.errors.length)
        : 0,
      confidence: confidenceOf(st.attempts),
      recommendation: `Drill words starting with ${affix.toUpperCase()}`,
      category: dominantCategory(st.errors),
    })
  }
  patterns.sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors)
  return patterns
}

export const analyzePrefixes = (sessions: readonly SessionLike[]) => analyzeAffix(sessions, 'prefix')
export const analyzeSuffixes = (sessions: readonly SessionLike[]) => analyzeAffix(sessions, 'suffix')

// ------------------------------------------------------------------ summary

export interface PatternAnalysis {
  bigrams: ProblemPattern[]
  trigrams: ProblemPattern[]
  substitutions: ProblemPattern[]
  transpositions: ProblemPattern[]
  prefixes: ProblemPattern[]
  suffixes: ProblemPattern[]
}

export function analyzePatterns(
  sessions: readonly SessionLike[],
  keyAttempts: ReadonlyMap<string, number>,
): PatternAnalysis {
  return {
    bigrams: analyzeNgrams(sessions, 2),
    trigrams: analyzeNgrams(sessions, 3),
    substitutions: analyzeSubstitutions(sessions, keyAttempts),
    transpositions: analyzeTranspositions(sessions),
    prefixes: analyzePrefixes(sessions),
    suffixes: analyzeSuffixes(sessions),
  }
}

/** The single most damaging combination across bigrams/transpositions. */
export function biggestPattern(analysis: PatternAnalysis): ProblemPattern | null {
  const candidates = [...analysis.bigrams, ...analysis.transpositions, ...analysis.trigrams].filter(
    (p) => p.attempts >= 8 && p.confidence >= 0.2,
  )
  if (candidates.length === 0) return null
  // risk = how often it fails, weighted by evidence and volume
  let best = candidates[0]
  let bestRisk = -1
  for (const p of candidates) {
    const risk = (1 - p.accuracy / 100) * p.confidence * Math.log2(1 + p.errors)
    if (risk > bestRisk) {
      bestRisk = risk
      best = p
    }
  }
  return best
}
