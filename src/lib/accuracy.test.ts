import { describe, expect, it } from 'vitest'
import { normalizeSession } from '@/stores/sessionsStore'
import type { TypingSession } from '@/types/typing'
import {
  accuracyToPercent,
  calculateAccuracy,
  calculateCorrectionRate,
  calculateErrorRate,
  formatAccuracy,
  roundAccuracy,
  toAccuracyRatio,
} from './accuracy'

describe('calculateAccuracy — THE formula (ratio 0..1)', () => {
  it('handles the documented spec cases', () => {
    expect(calculateAccuracy(0, 0)).toBe(0) // no attempts — never 100% / NaN / Infinity
    expect(calculateAccuracy(1, 0)).toBe(1)
    expect(calculateAccuracy(1, 1)).toBe(0)
    expect(calculateAccuracy(7, 2)).toBeCloseTo(0.7142857, 6) // 71.43%
    expect(calculateAccuracy(10, 2)).toBe(0.8) // 80.00%
    expect(calculateAccuracy(15, 2)).toBeCloseTo(0.8666667, 6) // 86.67%
    expect(calculateAccuracy(45, 8)).toBeCloseTo(0.8222222, 6) // 82.22%
    expect(calculateAccuracy(21, 3)).toBeCloseTo(0.8571429, 6) // 85.71%
    expect(calculateAccuracy(5, 0)).toBe(1) // 100.00%
  })

  it('stays inside [0,1] for degenerate inputs', () => {
    expect(calculateAccuracy(-5, -1)).toBe(0)
    expect(calculateAccuracy(Number.NaN, 0)).toBe(0)
    expect(calculateAccuracy(10, 99)).toBe(0) // errors > attempts clamps at 0
    expect(calculateAccuracy(10, Number.NaN)).toBe(1)
  })

  it('property: 0 ≤ accuracy ≤ 1 and 0 ≤ displayed ≤ 100 for random inputs', () => {
    let seed = 42
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 2 ** 32
    }
    for (let i = 0; i < 500; i++) {
      const attempts = Math.floor(rand() * 500) // 0..499
      const errors = Math.floor(rand() * (attempts + 1)) // 0..attempts
      const accuracy = calculateAccuracy(attempts, errors)

      expect(accuracy).toBeGreaterThanOrEqual(0)
      expect(accuracy).toBeLessThanOrEqual(1)

      const shown = Number(formatAccuracy(accuracy).replace('%', ''))
      expect(Number.isFinite(shown)).toBe(true)
      expect(shown).toBeGreaterThanOrEqual(0)
      expect(shown).toBeLessThanOrEqual(100)
      expect(shown).toBeLessThan(1000) // 7140%-style bugs can never appear
    }
  })
})

describe('formatAccuracy — the ONLY percentage formatter', () => {
  it('formats the spec examples exactly once (×100 inside the utility)', () => {
    expect(formatAccuracy(calculateAccuracy(7, 2))).toBe('71.43%')
    expect(formatAccuracy(calculateAccuracy(10, 2))).toBe('80.00%')
    expect(formatAccuracy(calculateAccuracy(15, 2))).toBe('86.67%')
    expect(formatAccuracy(calculateAccuracy(45, 8))).toBe('82.22%')
    expect(formatAccuracy(calculateAccuracy(21, 3))).toBe('85.71%')
    expect(formatAccuracy(calculateAccuracy(5, 0))).toBe('100.00%')
    expect(formatAccuracy(calculateAccuracy(0, 0))).toBe('0.00%')
    expect(formatAccuracy(0.8666667, 1)).toBe('86.7%')
  })

  it('never re-emits double-converted values like 7140% or 10000%', () => {
    expect(formatAccuracy(7140)).toBe('71.40%')
    expect(formatAccuracy(8670)).toBe('86.70%')
    expect(formatAccuracy(10000)).toBe('100.00%')
    expect(formatAccuracy(95)).toBe('95.00%') // legacy 0..100 input
    expect(formatAccuracy(7140)).not.toContain('7140')
  })

  it('shows an em-dash when there is no meaningful value', () => {
    expect(formatAccuracy(null)).toBe('—')
    expect(formatAccuracy(undefined)).toBe('—')
    expect(formatAccuracy(Number.NaN)).toBe('—')
  })
})

describe('accuracyToPercent — the single ×100 conversion', () => {
  it('converts ratios and deltas alike', () => {
    expect(accuracyToPercent(0.7142857)).toBe(71.43)
    expect(accuracyToPercent(1)).toBe(100)
    expect(accuracyToPercent(0)).toBe(0)
    expect(accuracyToPercent(0.8666667, 1)).toBe(86.7)
    expect(accuracyToPercent(-0.02)).toBe(-2) // deltas keep their sign
    expect(accuracyToPercent(Number.NaN)).toBe(0)
  })
})

describe('toAccuracyRatio — legacy normalisation (idempotent)', () => {
  it('maps legacy and corrupted values to the canonical ratio', () => {
    expect(toAccuracyRatio(95)).toBe(0.95)
    expect(toAccuracyRatio(71.4)).toBeCloseTo(0.714, 10)
    expect(toAccuracyRatio(7140)).toBeCloseTo(0.714, 10)
    expect(toAccuracyRatio(100)).toBe(1)
    expect(toAccuracyRatio(0.967)).toBe(0.967) // already canonical
    expect(toAccuracyRatio(1)).toBe(1)
    expect(toAccuracyRatio(0)).toBe(0)
    expect(toAccuracyRatio(-3)).toBe(0)
    expect(toAccuracyRatio(Number.NaN)).toBe(0)
    expect(toAccuracyRatio(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('is idempotent — applying it twice never changes a ratio', () => {
    for (const v of [0, 0.714, 0.95, 1, 71.4, 95, 7140]) {
      const once = toAccuracyRatio(v)
      expect(toAccuracyRatio(once)).toBe(once)
    }
  })
})

describe('roundAccuracy — canonical storage rounding', () => {
  it('clamps to [0,1] and keeps 4 decimals', () => {
    expect(roundAccuracy(0.95001)).toBe(0.95)
    expect(roundAccuracy(5 / 7)).toBe(0.7143)
    expect(roundAccuracy(-0.2)).toBe(0)
    expect(roundAccuracy(1.4)).toBe(1)
    expect(roundAccuracy(Number.NaN)).toBe(0)
  })
})

describe('error rate and correction rate (separate metrics, also ratios)', () => {
  it('error rate is the complement of accuracy', () => {
    expect(calculateErrorRate(10, 2)).toBe(0.2)
    expect(calculateErrorRate(0, 0)).toBe(0)
    expect(calculateAccuracy(10, 2) + calculateErrorRate(10, 2)).toBeCloseTo(1, 10)
  })

  it('correction rate = corrections / (corrections + uncorrected), 0 with no mistakes', () => {
    expect(calculateCorrectionRate(5, 3)).toBe(0.625)
    expect(calculateCorrectionRate(4, 0)).toBe(1)
    expect(calculateCorrectionRate(0, 0)).toBe(0) // never claims 100%
    expect(calculateCorrectionRate(0, 4)).toBe(0)
    expect(formatAccuracy(calculateCorrectionRate(0, 0), 0)).toBe('0%')
  })
})

describe('persisted-session normalisation (hydration migration)', () => {
  function legacySession(overrides: Partial<TypingSession['metrics']> = {}): TypingSession {
    return {
      id: 's1',
      userId: null,
      mode: 'words',
      source: 'test',
      target: 25,
      text: 'hello world',
      startedAt: '2026-01-01T00:00:00.000Z',
      finishedAt: '2026-01-01T00:01:00.000Z',
      metrics: {
        elapsedMs: 60_000,
        wpm: 50,
        grossWpm: 55,
        netWpm: 48,
        cpm: 275,
        accuracy: 95, // legacy 0..100
        errors: 5,
        uncorrectedErrors: 2,
        correctChars: 300,
        incorrectChars: 5,
        extraChars: 0,
        missedChars: 0,
        backspaces: 4,
        corrections: 3,
        correctionRate: 60, // legacy 0..100
        avgKeyDelayMs: 200,
        avgWordTimeMs: 900,
        avgPauseMs: 1500,
        consistency: 80,
        finalAccuracy: 98, // legacy 0..100
        ...overrides,
      },
      keyStats: [],
      errors: [],
      timeline: [
        { t: 1, wpm: 40, accuracy: 93.5 }, // legacy percent
        { t: 2, wpm: 50, accuracy: 96 },
      ],
    } as TypingSession
  }

  it('converts legacy 0..100 metrics and timeline samples to ratios', () => {
    const out = normalizeSession(legacySession())
    expect(out.metrics.accuracy).toBe(0.95)
    expect(out.metrics.finalAccuracy).toBe(0.98)
    expect(out.metrics.correctionRate).toBe(0.6)
    expect(out.timeline[0].accuracy).toBe(0.935)
    expect(out.timeline[1].accuracy).toBe(0.96)
    expect(formatAccuracy(out.metrics.accuracy)).toBe('95.00%')
  })

  it('resets the legacy "100% with no mistakes" correction default to 0', () => {
    const out = normalizeSession(legacySession({ corrections: 0, uncorrectedErrors: 0, correctionRate: 100 }))
    expect(out.metrics.correctionRate).toBe(0)
  })

  it('is idempotent — already-canonical sessions are left untouched', () => {
    const canonical = normalizeSession(legacySession())
    const again = normalizeSession(canonical)
    expect(again.metrics).toEqual(canonical.metrics)
    expect(again.timeline).toEqual(canonical.timeline)
  })
})
