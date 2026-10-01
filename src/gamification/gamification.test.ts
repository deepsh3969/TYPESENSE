import { describe, expect, it } from 'vitest'
import {
  applyActivity,
  creditDailyGoal,
  displayedStreak,
  goalProgress,
  goalReached,
} from '@/gamification/streaks'
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_MAP,
  TIER_LABEL,
  evaluateAchievements,
  type AchievementContext,
} from '@/gamification/achievements'
import type { DailyGoal, StreakState } from '@/types/gamification'

function streak(patch: Partial<StreakState> = {}): StreakState {
  return { current: 0, longest: 0, lastActiveDate: null, ...patch }
}

describe('streaks', () => {
  it('starts a streak on the first day of activity', () => {
    const out = applyActivity(streak(), '2026-01-01')
    expect(out.streak.current).toBe(1)
    expect(out.extended).toBe(true)
    expect(out.inactiveDays).toBe(0)
  })

  it('ignores same-day repeat activity', () => {
    const out = applyActivity(streak({ current: 4, lastActiveDate: '2026-01-05' }), '2026-01-05')
    expect(out.streak.current).toBe(4)
    expect(out.extended).toBe(false)
    expect(out.inactiveDays).toBe(0)
  })

  it('extends by one on consecutive days and tracks the longest run', () => {
    const out = applyActivity(streak({ current: 6, longest: 6, lastActiveDate: '2026-01-05' }), '2026-01-06')
    expect(out.streak).toEqual({ current: 7, longest: 7, lastActiveDate: '2026-01-06' })
    expect(out.extended).toBe(true)
  })

  it('resets to 1 after a gap and reports the inactive days', () => {
    const out = applyActivity(streak({ current: 9, longest: 9, lastActiveDate: '2026-01-01' }), '2026-01-05')
    expect(out.streak.current).toBe(1)
    expect(out.streak.longest).toBe(9) // history preserved
    expect(out.inactiveDays).toBe(3) // 2, 3, 4 missed
    expect(out.extended).toBe(true) // a new streak began
  })

  it('displayedStreak hides a broken streak but keeps a same/next-day one', () => {
    expect(displayedStreak(streak(), '2026-01-01')).toBe(0)
    expect(displayedStreak(streak({ current: 5, lastActiveDate: '2026-01-05' }), '2026-01-05')).toBe(5)
    expect(displayedStreak(streak({ current: 5, lastActiveDate: '2026-01-05' }), '2026-01-06')).toBe(5)
    expect(displayedStreak(streak({ current: 5, lastActiveDate: '2026-01-05' }), '2026-01-08')).toBe(0)
  })
})

describe('daily goal', () => {
  const goal: DailyGoal = { date: '2026-01-01', minutes: 5, goalMinutes: 15 }

  it('accumulates seconds within the same day', () => {
    const next = creditDailyGoal(goal, 120, '2026-01-01') // +2 min
    expect(next.minutes).toBe(7)
    expect(next.goalMinutes).toBe(15)
  })

  it('resets the counter when the day changes', () => {
    const next = creditDailyGoal(goal, 60, '2026-01-02')
    expect(next.date).toBe('2026-01-02')
    expect(next.minutes).toBe(1)
  })

  it('reports progress as a clamped percentage', () => {
    expect(goalProgress(goal)).toBeCloseTo(33.33, 1)
    expect(goalProgress({ ...goal, minutes: 40 })).toBe(100)
    expect(goalProgress({ ...goal, minutes: 0 })).toBeGreaterThanOrEqual(0)
    expect(goalProgress({ ...goal, goalMinutes: 0 })).toBe(100)
  })

  it('knows when the goal is reached', () => {
    expect(goalReached(goal)).toBe(false)
    expect(goalReached({ ...goal, minutes: 15 })).toBe(true)
  })
})

function ctx(patch: Partial<AchievementContext> = {}): AchievementContext {
  return {
    testsTaken: 0,
    bestWpm: 0,
    bestAccuracy: 0,
    bestConsistency: 0,
    totalMinutes: 0,
    streakCurrent: 0,
    lessonsCompleted: 0,
    level1Completed: false,
    level5Completed: false,
    improvedKeys: 0,
    patternImprovement: 0,
    currentHour: 12,
    inactiveDays: 0,
    ...patch,
  }
}

const ids = (list: { id: string }[]) => list.map((a) => a.id)

describe('evaluateAchievements', () => {
  it('unlocks nothing for a brand-new user', () => {
    expect(evaluateAchievements(ctx(), [])).toEqual([])
  })

  it('unlocks the first-test badge after one session', () => {
    expect(ids(evaluateAchievements(ctx({ testsTaken: 1 }), []))).toContain('first-test')
  })

  it('unlocks every speed tier the user qualifies for', () => {
    const unlocked = ids(evaluateAchievements(ctx({ testsTaken: 1, bestWpm: 65 }), []))
    expect(unlocked).toEqual(expect.arrayContaining(['wpm-20', 'wpm-40', 'wpm-60']))
    expect(unlocked).not.toContain('wpm-80')
  })

  it('unlocks accuracy badges from ratio values (0..1 contract)', () => {
    expect(ids(evaluateAchievements(ctx({ testsTaken: 1, bestAccuracy: 0.95 }), []))).toContain('acc-95')
    expect(ids(evaluateAchievements(ctx({ testsTaken: 1, bestAccuracy: 1 }), []))).toContain('acc-100')
    // 94.9% stays locked — and legacy 95-style numbers never count
    expect(ids(evaluateAchievements(ctx({ testsTaken: 1, bestAccuracy: 0.949 }), []))).not.toContain('acc-95')
    expect(ids(evaluateAchievements(ctx({ testsTaken: 1, bestAccuracy: 0.9 }), []))).not.toContain('acc-95')
  })

  it('never re-awards an achievement the user already owns', () => {
    expect(evaluateAchievements(ctx({ testsTaken: 1 }), [{ id: 'first-test' }])).toEqual([])
  })

  it('rewards streaks, time invested and comeback breaks', () => {
    const unlocked = ids(
      evaluateAchievements(
        ctx({ streakCurrent: 7, totalMinutes: 120, inactiveDays: 7, testsTaken: 1 }),
        [],
      ),
    )
    expect(unlocked).toEqual(expect.arrayContaining(['streak-3', 'streak-7', 'minutes-100', 'comeback']))
  })

  it('gates time-of-day badges behind having taken a test', () => {
    expect(ids(evaluateAchievements(ctx({ currentHour: 2 }), []))).not.toContain('night-owl')
    expect(ids(evaluateAchievements(ctx({ currentHour: 2, testsTaken: 1 }), []))).toContain('night-owl')
    expect(ids(evaluateAchievements(ctx({ currentHour: 6, testsTaken: 1 }), []))).toContain('early-bird')
  })
})

describe('achievement catalogue', () => {
  it('maps every achievement id and tier label', () => {
    for (const a of ACHIEVEMENTS) {
      expect(ACHIEVEMENT_MAP[a.id]).toBe(a)
      expect(TIER_LABEL[a.tier]).toBeTruthy()
      expect(a.xp).toBeGreaterThan(0)
      expect(a.title).toBeTruthy()
      expect(a.description).toBeTruthy()
    }
  })

  it('has unique ids', () => {
    const all = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(all).size).toBe(all.length)
  })
})
