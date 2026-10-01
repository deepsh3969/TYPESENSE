import { clamp } from '@/lib/utils'
import type { SessionMetrics } from '@/types/typing'

/**
 * ============================================================================
 *  TYPESENSE METRIC FORMULAS (documented, single source of truth)
 * ============================================================================
 *
 *  elapsedMin   = max(elapsedMs, 1000) / 60000          (clamped to avoid ∞)
 *
 *  Gross WPM    = (allPrintableKeystrokes / 5) / elapsedMin
 *  WPM          = (correctCharactersInText / 5) / elapsedMin      ← headline
 *  Net WPM      = max(0, Gross WPM − uncorrectedErrors / elapsedMin)
 *                 (classic penalty formula: errors cost one word each, per minute)
 *  CPM          = Gross WPM × 5
 *
 *  Accuracy     = correctKeystrokes / allPrintableKeystrokes × 100
 *                 (first-attempt keystroke accuracy — every press counts,
 *                  including presses that were later fixed)
 *  FinalAcc     = correctSlots / filledSlots × 100
 *                 (how much of the produced text matches the target)
 *  CorrectionRate = corrections / (corrections + uncorrectedErrors) × 100
 *                 (share of mistakes you actually cleaned up)
 *
 *  Consistency  = clamp(1 − (stdev(keyDelays) / mean(keyDelays)), 0, 1)
 *                 keyDelays exclude pauses > pauseThresholdMs
 * ============================================================================
 */

export interface LiveCounters {
  correctKeystrokes: number
  totalKeystrokes: number
  wrongKeystrokes: number
  backspaces: number
  corrections: number
  correctSlots: number
  filledSlots: number
  uncorrectedErrors: number
}

export interface TimingData {
  /** ms between consecutive presses, pauses already removed */
  delays: number[]
  /** ms per completed word (outliers removed by the engine) */
  wordTimes: number[]
  /** ms, each > pauseThreshold */
  pauses: number[]
}

const MIN_ELAPSED_MS = 1000

export function elapsedMinutes(elapsedMs: number): number {
  return Math.max(elapsedMs, MIN_ELAPSED_MS) / 60000
}

/** Headline WPM from characters currently correct in the buffer. */
export function computeWpm(correctChars: number, elapsedMs: number): number {
  return (correctChars / 5) / elapsedMinutes(elapsedMs)
}

export function computeGrossWpm(totalKeystrokes: number, elapsedMs: number): number {
  return (totalKeystrokes / 5) / elapsedMinutes(elapsedMs)
}

export function computeNetWpm(grossWpm: number, uncorrectedErrors: number, elapsedMs: number): number {
  return Math.max(0, grossWpm - uncorrectedErrors / elapsedMinutes(elapsedMs))
}

export function computeAccuracy(correctKeystrokes: number, totalKeystrokes: number): number {
  if (totalKeystrokes <= 0) return 100
  return (correctKeystrokes / totalKeystrokes) * 100
}

export function computeConsistency(delays: number[]): number {
  if (delays.length < 4) return 1
  const mean = delays.reduce((a, b) => a + b, 0) / delays.length
  if (mean <= 0) return 1
  const variance = delays.reduce((a, b) => a + (b - mean) ** 2, 0) / delays.length
  const cv = Math.sqrt(variance) / mean
  return clamp(1 - cv, 0, 1)
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

/** Live snapshot of the metrics that can change every keystroke. */
export interface LiveMetrics {
  wpm: number
  grossWpm: number
  netWpm: number
  accuracy: number
  consistency: number
}

export function computeLiveMetrics(counters: LiveCounters, timing: TimingData, elapsedMs: number): LiveMetrics {
  const grossWpm = computeGrossWpm(counters.totalKeystrokes, elapsedMs)
  return {
    wpm: computeWpm(counters.correctSlots, elapsedMs),
    grossWpm,
    netWpm: computeNetWpm(grossWpm, counters.uncorrectedErrors, elapsedMs),
    accuracy: computeAccuracy(counters.correctKeystrokes, counters.totalKeystrokes),
    consistency: computeConsistency(timing.delays),
  }
}

/** Final metrics for a completed session. */
export function computeMetrics(counters: LiveCounters, timing: TimingData, elapsedMs: number): SessionMetrics {
  const grossWpm = computeGrossWpm(counters.totalKeystrokes, elapsedMs)
  const accuracy = computeAccuracy(counters.correctKeystrokes, counters.totalKeystrokes)
  const finalAccuracy =
    counters.filledSlots > 0 ? (counters.correctSlots / counters.filledSlots) * 100 : 100
  const activeDelays = timing.delays.filter((d) => d > 0)

  return {
    elapsedMs,
    grossWpm: round1(grossWpm),
    netWpm: round1(computeNetWpm(grossWpm, counters.uncorrectedErrors, elapsedMs)),
    wpm: round1(computeWpm(counters.correctSlots, elapsedMs)),
    accuracy: round1(accuracy),
    finalAccuracy: round1(finalAccuracy),
    errors: 0, // filled by the engine (slow records excluded)
    uncorrectedErrors: counters.uncorrectedErrors,
    correctChars: counters.correctSlots,
    incorrectChars: Math.max(0, counters.filledSlots - counters.correctSlots),
    extraChars: 0,
    missedChars: 0,
    cpm: round1(grossWpm * 5),
    backspaces: counters.backspaces,
    corrections: counters.corrections,
    correctionRate: round1(
      counters.corrections + counters.uncorrectedErrors > 0
        ? (counters.corrections / (counters.corrections + counters.uncorrectedErrors)) * 100
        : 100,
    ),
    avgKeyDelayMs: Math.round(mean(activeDelays)),
    avgWordTimeMs: Math.round(mean(timing.wordTimes)),
    avgPauseMs: Math.round(mean(timing.pauses)),
    consistency: round1(computeConsistency(timing.delays) * 100),
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
