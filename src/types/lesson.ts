import type { Difficulty } from './typing'

export type LessonCategory = 'foundation' | 'reach' | 'accuracy' | 'speed' | 'mastery'

export type LessonStageKind = 'warmup' | 'practice' | 'challenge' | 'mini-test' | 'review'

export interface LessonStage {
  kind: LessonStageKind
  label: string
  /** target text for this stage */
  text: string
  /** minimum accuracy (0..100) required to pass, null = report only */
  goalAccuracy: number | null
  /** minimum wpm required to pass, null = report only */
  goalWpm: number | null
}

export interface Lesson {
  id: string
  /** curriculum level 1..5 */
  level: number
  order: number
  title: string
  objective: string
  category: LessonCategory
  estimatedMinutes: number
  difficulty: Difficulty
  /** keys/letters this lesson focuses on, used for unlocking + recommendations */
  keys: string[]
  stages: LessonStage[]
}

export type LessonStatus = 'locked' | 'available' | 'in-progress' | 'completed'

export interface LessonProgress {
  lessonId: string
  status: LessonStatus
  attempts: number
  bestAccuracy: number
  bestWpm: number
  completedAt: string | null
}

export interface LessonResult {
  lessonId: string
  accuracy: number
  wpm: number
  /** how many tracked errors remain compared with the first stage */
  errorsReduced: number
  /** percentage-point improvement across attempts */
  improvement: number
  passed: boolean
}

export interface Level {
  level: number
  title: string
  objective: string
  category: LessonCategory
  lessonIds: string[]
}
