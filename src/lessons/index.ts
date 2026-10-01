import { accuracyToPercent } from '@/lib/accuracy'
import type { Lesson, LessonStatus } from '@/types/lesson'
import type { LessonProgress } from '@/types/lesson'
import { LESSONS, LEVELS, getLesson } from '@/data/lessons'

export { LESSONS, LEVELS, getLesson }

/** Unlocks the next lesson once the previous one is completed. */
export function lessonStatus(lesson: Lesson, progress: Record<string, LessonProgress>): LessonStatus {
  const own = progress[lesson.id]
  if (own?.status === 'completed') return 'completed'
  if (own && own.attempts > 0) return 'in-progress'

  const sameLevel = LESSONS.filter((l) => l.level === lesson.level)
  const index = sameLevel.findIndex((l) => l.id === lesson.id)

  if (index === 0) {
    if (lesson.level === 1) return 'available'
    const prevLevelLessons = LESSONS.filter((l) => l.level === lesson.level - 1)
    const allDone = prevLevelLessons.every((l) => progress[l.id]?.status === 'completed')
    return allDone ? 'available' : 'locked'
  }

  const prev = sameLevel[index - 1]
  return progress[prev.id]?.status === 'completed' ? 'available' : 'locked'
}

export function levelCompletion(
  level: number,
  progress: Record<string, LessonProgress>,
): { completed: number; total: number; percent: number } {
  const lessons = LESSONS.filter((l) => l.level === level)
  const completed = lessons.filter((l) => progress[l.id]?.status === 'completed').length
  return { completed, total: lessons.length, percent: lessons.length ? (completed / lessons.length) * 100 : 0 }
}

export function overallCompletion(progress: Record<string, LessonProgress>): number {
  const completed = LESSONS.filter((l) => progress[l.id]?.status === 'completed').length
  return (completed / LESSONS.length) * 100
}

/** The lesson a learner should open next: first not-completed unlocked lesson. */
export function recommendedLesson(progress: Record<string, LessonProgress>): Lesson | null {
  for (const lesson of LESSONS) {
    if (lessonStatus(lesson, progress) !== 'completed' && lessonStatus(lesson, progress) !== 'locked') {
      return lesson
    }
  }
  return null
}

export interface StageOutcome {
  passed: boolean
  /** session accuracy, RATIO 0..1 */
  accuracy: number
  wpm: number
  /** lesson-config goal in PERCENT 0..100 (displayed as "% needed") */
  goalAccuracy: number
  goalWpm: number | null
}

/**
 * Pass/fail for a lesson stage.
 * `accuracy` is the canonical RATIO 0..1; the stage goal stays a percentage
 * (lesson config) and the single ×100 happens through `accuracyToPercent`.
 */
export function evaluateStage(
  lesson: Lesson,
  stageIndex: number,
  accuracy: number,
  wpm: number,
): StageOutcome {
  const stage = lesson.stages[stageIndex]
  const goalAccuracy = stage.goalAccuracy ?? 0
  const goalWpm = stage.goalWpm
  const passed =
    accuracyToPercent(accuracy, 2) >= goalAccuracy && (goalWpm === null || wpm >= goalWpm)
  return { passed, accuracy, wpm, goalAccuracy, goalWpm }
}
