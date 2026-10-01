import { describe, expect, it } from 'vitest'
import {
  LESSONS,
  evaluateStage,
  levelCompletion,
  lessonStatus,
  overallCompletion,
  recommendedLesson,
} from '@/lessons'
import { generatePracticeText, type PracticeContext } from '@/lessons/generators'
import type { PracticeModeId } from '@/types/profile'
import type { Lesson, LessonProgress } from '@/types/lesson'
import type { ProblemKey, WordStat } from '@/types/analytics'

function completed(lessonId: string): LessonProgress {
  return {
    lessonId,
    status: 'completed',
    attempts: 1,
    bestAccuracy: 0.99,
    bestWpm: 40,
    completedAt: '2026-01-01T00:00:00.000Z',
  }
}

function sameLevelLessons(lesson: Lesson): Lesson[] {
  return LESSONS.filter((l) => l.level === lesson.level)
}

describe('lessonStatus / unlock chain', () => {
  it('makes the first lesson of level 1 immediately available', () => {
    const first = LESSONS[0]
    expect(first.level).toBe(1)
    expect(lessonStatus(first, {})).toBe('available')
  })

  it('locks later lessons until the previous lesson in the level is completed', () => {
    const level1 = sameLevelLessons(LESSONS[0])
    const second = level1[1]
    expect(second).toBeDefined()
    expect(lessonStatus(second, {})).toBe('locked')
    expect(lessonStatus(second, { [level1[0].id]: completed(level1[0].id) })).toBe('available')
  })

  it('opens level 2 only after every level 1 lesson is completed', () => {
    const level2First = LESSONS.find((l) => l.level === 2)
    expect(level2First).toBeDefined()
    if (!level2First) return

    expect(lessonStatus(level2First, {})).toBe('locked')

    const level1 = sameLevelLessons(LESSONS[0])
    const allLevel1 = Object.fromEntries(level1.map((l) => [l.id, completed(l.id)]))
    expect(lessonStatus(level2First, allLevel1)).toBe('available')
  })

  it('reports completed and in-progress from stored progress', () => {
    const lesson = LESSONS[0]
    expect(lessonStatus(lesson, { [lesson.id]: completed(lesson.id) })).toBe('completed')
    expect(
      lessonStatus(lesson, {
        [lesson.id]: { ...completed(lesson.id), status: 'in-progress' },
      }),
    ).toBe('in-progress')
  })
})

describe('completion accounting', () => {
  it('counts level and overall completion', () => {
    const level1 = sameLevelLessons(LESSONS[0])
    const progress = { [level1[0].id]: completed(level1[0].id) }

    const level = levelCompletion(1, progress)
    expect(level.completed).toBe(1)
    expect(level.total).toBe(level1.length)
    expect(level.percent).toBeCloseTo((1 / level1.length) * 100, 5)

    const overall = overallCompletion(progress)
    expect(overall).toBeCloseTo((1 / LESSONS.length) * 100, 5)
  })

  it('recommends the first unlocked, not-completed lesson', () => {
    const first = LESSONS[0]
    expect(recommendedLesson({})?.id).toBe(first.id)

    const level1 = sameLevelLessons(first)
    const progress = { [level1[0].id]: completed(level1[0].id) }
    expect(recommendedLesson(progress)?.id).toBe(level1[1]?.id)
  })
})

describe('evaluateStage', () => {
  const lesson = LESSONS[0]
  const stage = lesson.stages[0]

  it('passes only when accuracy meets the goal', () => {
    const goalPercent = stage.goalAccuracy ?? 0
    expect(evaluateStage(lesson, 0, (goalPercent + 1) / 100, 0).passed).toBe(true)
    expect(evaluateStage(lesson, 0, Math.max(0, goalPercent - 1) / 100, 999).passed).toBe(false)
  })

  it('enforces the WPM goal when the stage has one', () => {
    const goalPercent = stage.goalAccuracy ?? 0
    const aboveAccuracy = (goalPercent + 1) / 100
    if (stage.goalWpm !== null) {
      expect(evaluateStage(lesson, 0, aboveAccuracy, stage.goalWpm).passed).toBe(true)
      expect(evaluateStage(lesson, 0, aboveAccuracy, Math.max(0, stage.goalWpm - 1)).passed).toBe(false)
    } else {
      // no speed gate on this stage — any WPM passes alongside the accuracy goal
      expect(evaluateStage(lesson, 0, aboveAccuracy, 1).passed).toBe(true)
    }
  })

  it('returns the goals alongside the result for the UI', () => {
    const out = evaluateStage(lesson, 0, 0.995, 42)
    expect(out.accuracy).toBe(0.995)
    expect(out.wpm).toBe(42)
    expect(out.goalAccuracy).toBe(stage.goalAccuracy ?? 0)
    expect(out.goalWpm).toBe(stage.goalWpm)
  })
})

describe('generatePracticeText', () => {
  const problemKey: ProblemKey = {
    key: 'q',
    attempts: 50,
    errors: 12,
    corrections: 3,
    accuracy: 0.76,
    errorRate: 0.24,
    avgResponseMs: 320,
    confidence: 0.9,
    score: 40,
    status: 'critical',
  }
  const weakWord: WordStat = { word: 'because', attempts: 20, errors: 6, accuracy: 0.7, avgTimeMs: 900 }
  const ctx: PracticeContext = {
    problemKeys: [problemKey],
    bigrams: [],
    substitutions: [],
    transpositions: [],
    weakWords: [weakWord],
    customText: 'Hello   World',
  }
  const empty: PracticeContext = {
    problemKeys: [],
    bigrams: [],
    substitutions: [],
    transpositions: [],
    weakWords: [],
  }

  const modes: PracticeModeId[] = [
    'problem-keys',
    'combinations',
    'weak-words',
    'speed-drill',
    'accuracy-drill',
    'precision',
    'flow',
    'punctuation',
    'numbers',
    'custom',
  ]

  it('produces non-empty text for every mode', () => {
    for (const mode of modes) {
      expect(generatePracticeText(mode, ctx).length, mode).toBeGreaterThan(10)
    }
  })

  it('seeds the learner weak key into problem-key drills', () => {
    expect(generatePracticeText('problem-keys', ctx)).toContain('q')
  })

  it('uses the learner weak words verbatim', () => {
    expect(generatePracticeText('weak-words', ctx)).toContain('because')
  })

  it('falls back to a speed drill when there is no context', () => {
    expect(generatePracticeText('problem-keys', empty).length).toBeGreaterThan(10)
    expect(generatePracticeText('precision', empty).length).toBeGreaterThan(10)
  })

  it('normalises custom text', () => {
    expect(generatePracticeText('custom', ctx)).toBe('Hello World')
  })
})
