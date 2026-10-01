import type { ProblemKey, KeyStatus } from '@/types/analytics'
import type { SessionLike } from './types'

export interface KeyAggregation {
  key: string
  attempts: number
  errors: number
  corrections: number
  totalDelayMs: number
  delaySamples: number
}

const DEFAULT_MIN_ATTEMPTS = 8

/** Sums per-key counters across sessions. */
export function aggregateKeyStats(sessions: readonly SessionLike[]): Map<string, KeyAggregation> {
  const map = new Map<string, KeyAggregation>()
  for (const session of sessions) {
    for (const stat of session.keyStats) {
      let agg = map.get(stat.key)
      if (!agg) {
        agg = { key: stat.key, attempts: 0, errors: 0, corrections: 0, totalDelayMs: 0, delaySamples: 0 }
        map.set(stat.key, agg)
      }
      agg.attempts += stat.attempts
      agg.errors += stat.errors
      agg.corrections += stat.corrections
      agg.totalDelayMs += stat.totalDelayMs
      agg.delaySamples += stat.delaySamples
    }
  }
  return map
}

/**
 * Confidence for a key: saturating function of attempts.
 * 8 attempts → ~0.15, 50 → ~0.63, 150 → ~0.95.
 */
export function confidenceFor(attempts: number): number {
  if (attempts <= 0) return 0
  return 1 - Math.exp(-attempts / 50)
}

export function statusFor(accuracy: number): KeyStatus {
  if (accuracy < 80) return 'critical'
  if (accuracy < 92) return 'needs-practice'
  if (accuracy < 97) return 'good'
  return 'strong'
}

/**
 * Problem-key scoring (Phase 7).
 *
 * Keys are ranked by *normalised health*, never by raw error counts:
 *   accuracy  = 1 − errors / attempts
 *   speedLoad = clamp((avgDelay − 250ms) / 400, 0, 1) × 8   (hesitation penalty)
 *   score     = accuracy% − speedLoad                        (0..100, higher = healthier)
 *
 * A key pressed 500× with 30 errors (94%) therefore stays healthier than a key
 * pressed 20× with 8 errors (60%). Confidence (evidence) is reported separately
 * and low-evidence keys are excluded from the headline list.
 */
export function computeProblemKeys(sessions: readonly SessionLike[]): ProblemKey[] {
  const aggregated = aggregateKeyStats(sessions)
  const keys: ProblemKey[] = []

  for (const agg of aggregated.values()) {
    if (agg.attempts <= 0) continue
    const accuracy = 1 - agg.errors / agg.attempts
    const avgResponseMs = agg.delaySamples > 0 ? agg.totalDelayMs / agg.delaySamples : 0
    const speedLoad =
      avgResponseMs > 0 ? Math.min(1, Math.max(0, (avgResponseMs - 250) / 400)) * 8 : 0
    const score = Math.max(0, Math.min(100, accuracy * 100 - speedLoad))
    keys.push({
      key: agg.key,
      attempts: agg.attempts,
      errors: agg.errors,
      corrections: agg.corrections,
      accuracy: Math.round(accuracy * 1000) / 10,
      errorRate: Math.round((agg.errors / agg.attempts) * 1000) / 10,
      avgResponseMs: Math.round(avgResponseMs),
      confidence: Math.round(confidenceFor(agg.attempts) * 100) / 100,
      score: Math.round(score * 10) / 10,
      status: statusFor(accuracy * 100),
    })
  }

  // worst first; more evidence breaks ties
  keys.sort((a, b) => a.score - b.score || b.attempts - a.attempts)
  return keys
}

/** Keys that deserve practice attention (enough evidence + not already strong). */
export function weakKeys(keys: readonly ProblemKey[], limit = 6): ProblemKey[] {
  return keys
    .filter((k) => k.key !== 'space' && k.attempts >= DEFAULT_MIN_ATTEMPTS && k.score < 94)
    .slice(0, limit)
}

export function healthyKeysCount(keys: readonly ProblemKey[]): number {
  return keys.filter((k) => k.status === 'strong' || k.status === 'good').length
}
