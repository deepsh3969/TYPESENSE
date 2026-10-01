import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserState, UserProfile, UserStats } from '@/types/profile'
import type { AchievementId, XpSource } from '@/types/gamification'
import type { TypingSession } from '@/types/typing'
import type { LessonResult } from '@/types/lesson'
import { createId } from '@/lib/id'
import { toAccuracyRatio } from '@/lib/accuracy'
import { todayKey } from '@/lib/utils'
import { levelFromXp, sessionXp, XP_REWARDS } from '@/gamification/levels'
import { applyActivity } from '@/gamification/streaks'
import {
  ACHIEVEMENT_MAP,
  evaluateAchievements,
  type AchievementContext,
} from '@/gamification/achievements'

export interface SessionOutcome {
  xp: number
  levelUp: { from: number; to: number } | null
  unlocked: AchievementId[]
  streakExtended: boolean
  streak: number
  goalProgress: number
  goalReached: boolean
}

function defaultState(): UserState {
  const today = todayKey()
  return {
    profile: {
      id: 'local-user',
      displayName: 'Typist',
      avatar: 'keyboard',
      xp: 0,
      level: 1,
      dailyGoalMinutes: 15,
      preferredDifficulty: 3,
      createdAt: new Date().toISOString(),
      mode: 'local',
    },
    stats: {
      totalPracticeSeconds: 0,
      testsTaken: 0,
      lessonsCompleted: 0,
      bestWpm: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      bestAccuracy: 0,
      bestConsistency: 0,
    },
    streak: { current: 0, longest: 0, lastActiveDate: null },
    dailyGoal: { date: today, minutes: 0, goalMinutes: 15 },
    achievements: [],
    xpLog: [],
  }
}

export function buildAchievementContext(
  data: UserState,
  extras: Partial<AchievementContext> = {},
): AchievementContext {
  const info = levelFromXp(data.profile.xp)
  return {
    testsTaken: data.stats.testsTaken,
    bestWpm: data.stats.bestWpm,
    bestAccuracy: data.stats.bestAccuracy,
    bestConsistency: data.stats.bestConsistency,
    totalMinutes: data.stats.totalPracticeSeconds / 60,
    streakCurrent: data.streak.current,
    lessonsCompleted: data.stats.lessonsCompleted,
    level1Completed: false,
    level5Completed: false,
    improvedKeys: 0,
    patternImprovement: 0,
    currentHour: new Date().getHours(),
    inactiveDays: 0,
    ...extras,
    // keep in sync unless explicitly overridden
    ...(info.level !== data.profile.level ? {} : {}),
  }
}

interface UserStore {
  data: UserState
  setProfile: (patch: Partial<Pick<UserProfile, 'displayName' | 'avatar' | 'dailyGoalMinutes' | 'preferredDifficulty' | 'mode'>>) => void
  recordSession: (
    session: Pick<TypingSession, 'metrics' | 'source' | 'startedAt'>,
    extras?: Partial<AchievementContext>,
  ) => SessionOutcome
  recordLesson: (result: LessonResult) => SessionOutcome
  addXp: (amount: number, source: XpSource, label: string) => number
  unlockAchievement: (id: AchievementId) => boolean
  resetProgress: () => void
}

function pushXp(data: UserState, amount: number, source: XpSource, label: string): UserState {
  const xp = data.profile.xp + amount
  const info = levelFromXp(xp)
  return {
    ...data,
    profile: { ...data.profile, xp, level: info.level },
    xpLog: [
      { id: createId('xp'), source, amount, label, at: new Date().toISOString() },
      ...data.xpLog,
    ].slice(0, 40),
  }
}

function grantAchievements(
  data: UserState,
  ctx: AchievementContext,
): { data: UserState; unlocked: AchievementId[] } {
  const fresh = evaluateAchievements(ctx, data.achievements)
  if (fresh.length === 0) return { data, unlocked: [] }
  let next = data
  const unlocked: AchievementId[] = []
  for (const def of fresh) {
    next = pushXp(next, def.xp * XP_REWARDS.achievementMultiplier, 'achievement', def.title)
    next = {
      ...next,
      achievements: [...next.achievements, { id: def.id, unlockedAt: new Date().toISOString() }],
    }
    unlocked.push(def.id)
  }
  return { data: next, unlocked }
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      data: defaultState(),

      setProfile: (patch) =>
        set((s) => {
          const data = {
            ...s.data,
            profile: { ...s.data.profile, ...patch },
          }
          if (patch.dailyGoalMinutes !== undefined && patch.dailyGoalMinutes !== data.dailyGoal.goalMinutes) {
            data.dailyGoal = { ...data.dailyGoal, goalMinutes: patch.dailyGoalMinutes }
          }
          return { data }
        }),

      recordSession: (session, extras = {}) => {
        const prev = get().data
        const fromLevel = prev.profile.level
        const m = session.metrics
        const seconds = m.elapsedMs / 1000

        let data: UserState = { ...prev }
        const stats: UserStats = { ...prev.stats }
        stats.totalPracticeSeconds += seconds
        if (session.source === 'test') stats.testsTaken += 1
        stats.bestWpm = Math.max(stats.bestWpm, m.netWpm)
        stats.bestAccuracy = Math.max(stats.bestAccuracy, m.accuracy)
        // m.consistency is already 0..100 — never multiply it again
        stats.bestConsistency = Math.max(stats.bestConsistency, Math.round(m.consistency))
        const n = stats.testsTaken
        if (n > 0 && session.source === 'test') {
          stats.avgWpm = prev.stats.avgWpm + (m.netWpm - prev.stats.avgWpm) / n
          stats.avgAccuracy = prev.stats.avgAccuracy + (m.accuracy - prev.stats.avgAccuracy) / n
        }
        data.stats = stats

        const activity = applyActivity(prev.streak)
        data.streak = activity.streak

        const goalDate = data.dailyGoal.date
        const today = todayKey()
        const baseGoal =
          goalDate === today ? data.dailyGoal : { ...data.dailyGoal, date: today, minutes: 0 }
        data.dailyGoal = {
          ...baseGoal,
          minutes: baseGoal.minutes + seconds / 60,
        }

        const xpGain = sessionXp({
          seconds,
          netWpm: m.netWpm,
          accuracy: m.accuracy,
          consistency: m.consistency,
        })
        data = pushXp(data, xpGain, 'session', `${Math.round(m.netWpm)} WPM test`)

        const ctx = buildAchievementContext(data, { ...extras, inactiveDays: activity.inactiveDays })
        const granted = grantAchievements(data, ctx)
        data = granted.data

        set({ data })
        return {
          xp: xpGain,
          levelUp: fromLevel !== data.profile.level ? { from: fromLevel, to: data.profile.level } : null,
          unlocked: granted.unlocked,
          streakExtended: activity.extended,
          streak: data.streak.current,
          goalProgress: Math.min(100, (data.dailyGoal.minutes / data.dailyGoal.goalMinutes) * 100),
          goalReached: data.dailyGoal.minutes >= data.dailyGoal.goalMinutes,
        }
      },

      recordLesson: (result) => {
        const prev = get().data
        const fromLevel = prev.profile.level
        let data = pushXp(prev, XP_REWARDS.lesson, 'lesson', result.lessonId)
        if (result.passed) {
          data = {
            ...data,
            stats: { ...data.stats, lessonsCompleted: data.stats.lessonsCompleted + 1 },
          }
        }
        const ctx = buildAchievementContext(data)
        const granted = grantAchievements(data, ctx)
        data = granted.data
        set({ data })
        return {
          xp: XP_REWARDS.lesson,
          levelUp: fromLevel !== data.profile.level ? { from: fromLevel, to: data.profile.level } : null,
          unlocked: granted.unlocked,
          streakExtended: false,
          streak: data.streak.current,
          goalProgress: Math.min(100, (data.dailyGoal.minutes / data.dailyGoal.goalMinutes) * 100),
          goalReached: data.dailyGoal.minutes >= data.dailyGoal.goalMinutes,
        }
      },

      addXp: (amount, source, label) => {
        set((s) => ({ data: pushXp(s.data, amount, source, label) }))
        return amount
      },

      unlockAchievement: (id) => {
        const s = get()
        if (s.data.achievements.some((a) => a.id === id)) return false
        const def = ACHIEVEMENT_MAP[id]
        if (!def) return false
        let data = pushXp(s.data, def.xp, 'achievement', def.title)
        data = { ...data, achievements: [...data.achievements, { id, unlockedAt: new Date().toISOString() }] }
        set({ data })
        return true
      },

      resetProgress: () => set({ data: defaultState() }),
    }),
    {
      name: 'typesense-user',
      version: 1,
      merge: (persisted, current) => {
        const p = persisted as Partial<UserStore> | undefined
        if (!p?.data) return current
        const stats = { ...current.data.stats, ...p.data.stats }
        // Accuracy contract migration: ratios 0..1 (idempotent for canonical data).
        stats.avgAccuracy = toAccuracyRatio(stats.avgAccuracy)
        stats.bestAccuracy = toAccuracyRatio(stats.bestAccuracy)
        // bestConsistency is 0..100; older builds stored it ×100 too large.
        if (Number.isFinite(stats.bestConsistency) && stats.bestConsistency > 100) {
          stats.bestConsistency = Math.min(100, Math.round(stats.bestConsistency / 100))
        }
        return {
          ...current,
          data: {
            ...current.data,
            ...p.data,
            profile: { ...current.data.profile, ...p.data.profile },
            stats,
            streak: { ...current.data.streak, ...p.data.streak },
            dailyGoal: { ...current.data.dailyGoal, ...p.data.dailyGoal },
          },
        }
      },
    },
  ),
)
