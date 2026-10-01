import type { DailyGoal, StreakState } from '@/types/gamification'
import { daysBetween, todayKey } from '@/lib/utils'

export interface StreakResult {
  streak: StreakState
  /** true when this activity extended the streak */
  extended: boolean
  /** days inactive directly before today's activity (0 if continuous) */
  inactiveDays: number
}

/** Applies one day of activity to the streak. Same-day calls are no-ops. */
export function applyActivity(streak: StreakState, today = todayKey()): StreakResult {
  if (streak.lastActiveDate === today) {
    return { streak, extended: false, inactiveDays: 0 }
  }
  if (!streak.lastActiveDate) {
    return {
      streak: { current: 1, longest: Math.max(1, streak.longest), lastActiveDate: today },
      extended: true,
      inactiveDays: 0,
    }
  }
  const gap = daysBetween(streak.lastActiveDate, today)
  if (gap === 1) {
    const current = streak.current + 1
    return {
      streak: { current, longest: Math.max(current, streak.longest), lastActiveDate: today },
      extended: true,
      inactiveDays: 0,
    }
  }
  return {
    streak: { current: 1, longest: Math.max(streak.longest, streak.current), lastActiveDate: today },
    extended: true,
    inactiveDays: Math.max(0, gap - 1),
  }
}

/** Current streak if no activity happened today yet (used for display). */
export function displayedStreak(streak: StreakState, today = todayKey()): number {
  if (!streak.lastActiveDate) return 0
  const gap = daysBetween(streak.lastActiveDate, today)
  return gap <= 1 ? streak.current : 0
}

export function creditDailyGoal(goal: DailyGoal, seconds: number, today = todayKey()): DailyGoal {
  const fresh: DailyGoal = goal.date === today ? goal : { date: today, minutes: 0, goalMinutes: goal.goalMinutes }
  return { ...fresh, minutes: fresh.minutes + seconds / 60 }
}

export function goalProgress(goal: DailyGoal): number {
  if (goal.goalMinutes <= 0) return 100
  return Math.max(0, Math.min(100, (goal.minutes / goal.goalMinutes) * 100))
}

export function goalReached(goal: DailyGoal): boolean {
  return goal.minutes >= goal.goalMinutes
}
