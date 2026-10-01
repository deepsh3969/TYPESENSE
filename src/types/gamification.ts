export type AchievementId =
  | 'first-test'
  | 'wpm-20'
  | 'wpm-40'
  | 'wpm-60'
  | 'wpm-80'
  | 'acc-95'
  | 'acc-100'
  | 'streak-3'
  | 'streak-7'
  | 'streak-30'
  | 'minutes-100'
  | 'minutes-500'
  | 'problem-solver'
  | 'error-crusher'
  | 'consistency-master'
  | 'lesson-foundation'
  | 'lesson-mastery'
  | 'night-owl'
  | 'early-bird'
  | 'comeback'

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Achievement {
  id: AchievementId
  title: string
  description: string
  tier: AchievementTier
  xp: number
  icon: string
}

export interface UserAchievement {
  id: AchievementId
  unlockedAt: string
}

export interface DailyGoal {
  /** YYYY-MM-DD in local time */
  date: string
  /** minutes completed so far today */
  minutes: number
  /** target minutes */
  goalMinutes: number
}

export interface StreakState {
  current: number
  longest: number
  /** YYYY-MM-DD of the last day activity was recorded */
  lastActiveDate: string | null
}

export type XpSource = 'session' | 'lesson' | 'achievement' | 'streak' | 'goal'

export interface XpEvent {
  id: string
  source: XpSource
  amount: number
  label: string
  at: string
}
