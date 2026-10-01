import type { Difficulty } from './typing'
import type { DailyGoal, StreakState, UserAchievement, XpEvent } from './gamification'

export type PracticeModeId =
  | 'problem-keys'
  | 'combinations'
  | 'weak-words'
  | 'speed-drill'
  | 'accuracy-drill'
  | 'precision'
  | 'flow'
  | 'punctuation'
  | 'numbers'
  | 'custom'

export interface PracticeMode {
  id: PracticeModeId
  title: string
  description: string
  icon: string
  accent: 'indigo' | 'cyan' | 'green' | 'amber' | 'rose'
}

export interface PracticeSession {
  id: string
  mode: PracticeModeId
  /** what the drill was built from, e.g. key "r" or pattern "th" */
  focus: string
  text: string
  wpm: number
  /** RATIO 0..1 (session.metrics.accuracy) */
  accuracy: number
  seconds: number
  at: string
}

export interface UserProfile {
  id: string
  displayName: string
  avatar: string
  /** 0..100 progress towards the next level */
  xp: number
  level: number
  dailyGoalMinutes: number
  preferredDifficulty: Difficulty
  createdAt: string
  /** 'local' when running without Supabase auth */
  mode: 'local' | 'cloud'
}

export interface UserStats {
  totalPracticeSeconds: number
  testsTaken: number
  lessonsCompleted: number
  bestWpm: number
  avgWpm: number
  /** RATIO 0..1 */
  avgAccuracy: number
  /** RATIO 0..1 */
  bestAccuracy: number
  /** 0..100 */
  bestConsistency: number
}

export interface UserState {
  profile: UserProfile
  stats: UserStats
  streak: StreakState
  dailyGoal: DailyGoal
  achievements: UserAchievement[]
  xpLog: XpEvent[]
}
