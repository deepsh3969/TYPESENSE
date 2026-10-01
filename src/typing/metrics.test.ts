import { describe, expect, it } from 'vitest'
import {
  computeAccuracy,
  computeConsistency,
  computeGrossWpm,
  computeLiveMetrics,
  computeMetrics,
  computeNetWpm,
  computeWpm,
  elapsedMinutes,
  type LiveCounters,
  type TimingData,
} from '@/typing/metrics'

function counters(patch: Partial<LiveCounters> = {}): LiveCounters {
  return {
    correctKeystrokes: 0,
    totalKeystrokes: 0,
    wrongKeystrokes: 0,
    backspaces: 0,
    corrections: 0,
    correctSlots: 0,
    filledSlots: 0,
    uncorrectedErrors: 0,
    ...patch,
  }
}

function timing(patch: Partial<TimingData> = {}): TimingData {
  return { delays: [], wordTimes: [], pauses: [], ...patch }
}

describe('elapsedMinutes', () => {
  it('clamps sub-second runs to one second to avoid division blowups', () => {
    expect(elapsedMinutes(0)).toBeCloseTo(1 / 60, 10)
    expect(elapsedMinutes(500)).toBeCloseTo(1 / 60, 10)
    expect(elapsedMinutes(60_000)).toBe(1)
  })
})

describe('WPM formulas', () => {
  it('headline WPM counts correct characters in words of five', () => {
    // 100 correct chars in one minute → 20 WPM
    expect(computeWpm(100, 60_000)).toBeCloseTo(20, 6)
    // 25 correct chars in 30s → (25/5) / 0.5 = 10 WPM
    expect(computeWpm(25, 30_000)).toBeCloseTo(10, 6)
  })

  it('gross WPM counts every printable keystroke', () => {
    expect(computeGrossWpm(300, 60_000)).toBeCloseTo(60, 6)
  })

  it('net WPM subtracts one word per uncorrected error per minute', () => {
    expect(computeNetWpm(50, 10, 60_000)).toBeCloseTo(40, 6)
    expect(computeNetWpm(50, 10, 30_000)).toBeCloseTo(30, 6)
  })

  it('net WPM never goes below zero', () => {
    expect(computeNetWpm(5, 100, 60_000)).toBe(0)
  })
})

describe('accuracy', () => {
  it('is first-attempt keystroke accuracy', () => {
    expect(computeAccuracy(90, 100)).toBeCloseTo(90, 6)
    expect(computeAccuracy(0, 0)).toBe(100)
  })
})

describe('consistency', () => {
  it('is perfect with fewer than four samples', () => {
    expect(computeConsistency([])).toBe(1)
    expect(computeConsistency([100, 110])).toBe(1)
  })

  it('is 1 for perfectly even delays', () => {
    expect(computeConsistency([120, 120, 120, 120, 120])).toBe(1)
  })

  it('drops as delays become more erratic, staying within 0..1', () => {
    const steady = computeConsistency([100, 104, 98, 102, 100, 99, 101])
    const erratic = computeConsistency([40, 400, 60, 900, 50, 700, 45])
    expect(erratic).toBeLessThan(steady)
    expect(erratic).toBeGreaterThanOrEqual(0)
    expect(steady).toBeLessThanOrEqual(1)
  })
})

describe('computeMetrics', () => {
  it('produces the documented rounded final metrics', () => {
    const m = computeMetrics(
      counters({
        correctKeystrokes: 95,
        totalKeystrokes: 100,
        correctSlots: 90,
        filledSlots: 94,
        uncorrectedErrors: 3,
        corrections: 5,
        backspaces: 5,
      }),
      timing({ delays: [100, 100, 100, 100, 100], wordTimes: [800, 900], pauses: [1500] }),
      60_000,
    )

    expect(m.elapsedMs).toBe(60_000)
    expect(m.accuracy).toBe(95) // 95/100
    expect(m.finalAccuracy).toBeCloseTo(95.7, 1) // 90/94
    expect(m.correctChars).toBe(90)
    expect(m.incorrectChars).toBe(4)
    expect(m.wpm).toBeCloseTo(18, 1) // (90/5)/1min
    expect(m.grossWpm).toBe(20) // (100/5)/1min
    expect(m.netWpm).toBe(17) // 20 − 3 uncorrected
    expect(m.cpm).toBe(100) // gross × 5
    expect(m.correctionRate).toBeCloseTo(62.5, 1) // 5/(5+3)
    expect(m.consistency).toBe(100) // even delays
    expect(m.avgWordTimeMs).toBe(850)
    expect(m.avgPauseMs).toBe(1500)
  })

  it('defaults to 100% when nothing was typed', () => {
    const m = computeMetrics(counters(), timing(), 1000)
    expect(m.accuracy).toBe(100)
    expect(m.finalAccuracy).toBe(100)
    expect(m.correctionRate).toBe(100)
    expect(m.wpm).toBe(0)
  })

  it('exposes the same values through the live snapshot', () => {
    const live = computeLiveMetrics(
      counters({ correctKeystrokes: 50, totalKeystrokes: 50, correctSlots: 50 }),
      timing({ delays: [100, 100, 100, 100] }),
      60_000,
    )
    expect(live.accuracy).toBe(100)
    expect(live.wpm).toBe(10)
    expect(live.grossWpm).toBe(10)
    expect(live.netWpm).toBe(10)
    expect(live.consistency).toBe(1)
  })
})
