import { accuracyToPercent, calculateAccuracy, roundAccuracy } from '@/lib/accuracy'
import type { AnalyticsSummary, ProblemPattern, WordStat } from '@/types/analytics'
import type { SessionLike } from '@/types/typing'
import { aggregateKeyStats, computeProblemKeys } from './problemKeys'
import { analyzePatterns, analyzeWords, biggestPattern, weakWords, type PatternAnalysis } from './patterns'

export type RangeDays = 7 | 30 | 90 | 'all'

export function filterSince(sessions: readonly SessionLike[], range: RangeDays): SessionLike[] {
  if (range === 'all') return [...sessions]
  const cutoff = Date.now() - range * 86_400_000
  return sessions.filter((s) => new Date(s.startedAt).getTime() >= cutoff)
}

export interface DailyPoint {
  date: string
  wpm: number | null
  /** RATIO 0..1 (null on days without sessions) */
  accuracy: number | null
  minutes: number
  errors: number
}

/** One point per day across the range; days without sessions carry null metrics. */
export function dailySeries(sessions: readonly SessionLike[], range: RangeDays): DailyPoint[] {
  const days = range === 'all' ? 30 : range
  const byDay = new Map<string, SessionLike[]>()
  for (const s of sessions) {
    const key = s.startedAt.slice(0, 10)
    const list = byDay.get(key) ?? []
    list.push(s)
    byDay.set(key, list)
  }

  const points: DailyPoint[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000)
    const key = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`
    const list = byDay.get(key)
    if (!list || list.length === 0) {
      points.push({ date: key, wpm: null, accuracy: null, minutes: 0, errors: 0 })
      continue
    }
    const n = list.length
    points.push({
      date: key,
      wpm: Math.round((list.reduce((a, s) => a + s.metrics.wpm, 0) / n) * 10) / 10,
      accuracy: roundAccuracy(list.reduce((a, s) => a + s.metrics.accuracy, 0) / n),
      minutes: Math.round(list.reduce((a, s) => a + s.metrics.elapsedMs / 60000, 0) * 10) / 10,
      errors: list.reduce((a, s) => a + s.metrics.errors, 0),
    })
  }
  return points
}

/** First-half vs second-half improvement inside a window (percentage points / wpm). */
export function windowDelta(sessions: readonly SessionLike[]): { wpmDelta: number; accuracyDelta: number } {
  if (sessions.length < 4) return { wpmDelta: 0, accuracyDelta: 0 }
  const ordered = [...sessions].sort((a, b) => +new Date(a.startedAt) - +new Date(b.startedAt))
  const half = Math.floor(ordered.length / 2)
  const meanWpm = (list: SessionLike[]) => list.reduce((a, s) => a + s.metrics.wpm, 0) / list.length
  const meanAcc = (list: SessionLike[]) => list.reduce((a, s) => a + s.metrics.accuracy, 0) / list.length
  const first = ordered.slice(0, half)
  const second = ordered.slice(half)
  return {
    wpmDelta: Math.round((meanWpm(second) - meanWpm(first)) * 10) / 10,
    accuracyDelta: accuracyToPercent(meanAcc(second) - meanAcc(first), 1),
  }
}

export interface KeyAccuracy {
  attempts: number
  errors: number
  /** RATIO 0..1 */
  accuracy: number
}

/** Normalised accuracy for one physical key across the given sessions. */
export function keyAccuracyFor(sessions: readonly SessionLike[], key: string): KeyAccuracy | null {
  const agg = aggregateKeyStats(sessions).get(key)
  if (!agg || agg.attempts === 0) return null
  return {
    attempts: agg.attempts,
    errors: agg.errors,
    accuracy: roundAccuracy(calculateAccuracy(agg.attempts, agg.errors)),
  }
}

export interface FullAnalysis {
  summary: AnalyticsSummary
  patterns: PatternAnalysis
  topPattern: ProblemPattern | null
  words: WordStat[]
}

/** Runs every analysis pass over a session list. Memoise at the call site. */
export function analyze(sessions: readonly SessionLike[]): FullAnalysis {
  const problemKeys = computeProblemKeys(sessions)
  const agg = aggregateKeyStats(sessions)
  const keyAttempts = new Map<string, number>()
  for (const [key, a] of agg) keyAttempts.set(key, a.attempts)
  const patterns = analyzePatterns(sessions, keyAttempts)
  const words = analyzeWords(sessions)
  const topPattern = biggestPattern(patterns)

  const n = sessions.length
  const summary: AnalyticsSummary = {
    sessions: n,
    totalSeconds: Math.round(sessions.reduce((a, s) => a + s.metrics.elapsedMs / 1000, 0)),
    avgWpm: n ? Math.round((sessions.reduce((a, s) => a + s.metrics.wpm, 0) / n) * 10) / 10 : 0,
    bestWpm: n ? Math.max(...sessions.map((s) => s.metrics.wpm)) : 0,
    avgAccuracy: n ? roundAccuracy(sessions.reduce((a, s) => a + s.metrics.accuracy, 0) / n) : 0,
    avgConsistency: n
      ? Math.round((sessions.reduce((a, s) => a + s.metrics.consistency, 0) / n) * 10) / 10
      : 0,
    ...windowDelta(sessions),
    problemKeys,
    patterns: [...patterns.bigrams, ...patterns.transpositions, ...patterns.substitutions]
      .sort((a, b) => b.errors - a.errors)
      .slice(0, 10),
    weakWords: weakWords(words),
  }

  return { summary, patterns, topPattern, words }
}
