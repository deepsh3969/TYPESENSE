import { describe, expect, it } from 'vitest'
import { levelFromXp, levelTitle, sessionXp, thresholdForLevel } from '@/gamification/levels'

describe('level thresholds', () => {
  it('starts at 0 XP and grows super-linearly', () => {
    expect(thresholdForLevel(1)).toBe(0)
    expect(thresholdForLevel(2)).toBe(200)
    expect(thresholdForLevel(3)).toBeGreaterThan(thresholdForLevel(2))
    expect(thresholdForLevel(4)).toBeGreaterThan(thresholdForLevel(3))
  })
})

describe('levelFromXp', () => {
  it('places a beginner at level 1 with a fresh bar', () => {
    const info = levelFromXp(0)
    expect(info.level).toBe(1)
    expect(info.intoLevel).toBe(0)
    expect(info.progress).toBe(0)
    expect(info.toNext).toBe(thresholdForLevel(2))
    expect(info.title).toBe(levelTitle(1))
  })

  it('advances exactly at the threshold', () => {
    const atThreshold = levelFromXp(thresholdForLevel(2))
    expect(atThreshold.level).toBe(2)
    expect(atThreshold.intoLevel).toBe(0)
    expect(atThreshold.progress).toBe(0)
  })

  it('keeps a just-below-threshold XP in the previous level', () => {
    const info = levelFromXp(thresholdForLevel(2) - 1)
    expect(info.level).toBe(1)
    expect(info.toNext).toBe(1)
    expect(info.progress).toBeGreaterThan(99)
    expect(info.progress).toBeLessThanOrEqual(100)
  })

  it('reports monotonic progress inside a band', () => {
    const mid = thresholdForLevel(2) + Math.floor((thresholdForLevel(3) - thresholdForLevel(2)) / 2)
    const info = levelFromXp(mid)
    expect(info.level).toBe(2)
    expect(info.progress).toBeGreaterThan(0)
    expect(info.progress).toBeLessThan(100)
    expect(info.intoLevel + info.toNext).toBe(thresholdForLevel(3) - thresholdForLevel(2))
  })

  it('caps the title at the highest defined rank', () => {
    expect(levelTitle(999)).toBe(levelTitle(12))
  })
})

describe('sessionXp', () => {
  it('never awards less than the 5 XP floor', () => {
    expect(sessionXp({ seconds: 0, netWpm: 0, accuracy: 0, consistency: 0 })).toBe(5)
  })

  it('rewards time, speed, accuracy and rhythm together', () => {
    const full = sessionXp({ seconds: 60, netWpm: 60, accuracy: 0.99, consistency: 90 })
    // base 8 + speed 36 + quality 25 + rhythm 10
    expect(full).toBe(79)

    const plain = sessionXp({ seconds: 60, netWpm: 60, accuracy: 0.8, consistency: 50 })
    // base 8 + speed 36, no quality or rhythm bonus
    expect(plain).toBe(44)
    expect(full).toBeGreaterThan(plain)
  })
})
