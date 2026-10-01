import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toAccuracyRatio } from '@/lib/accuracy'
import type { LessonProgress } from '@/types/lesson'
import type { PracticeSession } from '@/types/profile'

const MAX_PRACTICE = 120

interface ProgressStore {
  lessonProgress: Record<string, LessonProgress>
  practiceHistory: PracticeSession[]
  upsertLessonProgress: (progress: LessonProgress) => void
  addPractice: (session: PracticeSession) => void
  clearPractice: () => void
  reset: () => void
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set) => ({
      lessonProgress: {},
      practiceHistory: [],
      upsertLessonProgress: (progress) =>
        set((s) => ({ lessonProgress: { ...s.lessonProgress, [progress.lessonId]: progress } })),
      addPractice: (session) =>
        set((s) => ({ practiceHistory: [session, ...s.practiceHistory].slice(0, MAX_PRACTICE) })),
      clearPractice: () => set({ practiceHistory: [] }),
      reset: () => set({ lessonProgress: {}, practiceHistory: [] }),
    }),
    {
      name: 'typesense-progress',
      version: 2,
      migrate: (persisted) => {
        const p = persisted as Partial<ProgressStore> | undefined
        const lessonProgress: Record<string, LessonProgress> = {}
        for (const [id, row] of Object.entries(p?.lessonProgress ?? {})) {
          lessonProgress[id] = { ...row, bestAccuracy: toAccuracyRatio(row.bestAccuracy) }
        }
        const practiceHistory = (p?.practiceHistory ?? []).map((s) => ({
          ...s,
          accuracy: toAccuracyRatio(s.accuracy),
        }))
        return { lessonProgress, practiceHistory } as ProgressStore
      },
    },
  ),
)

export function selectCompletedLessons(map: Record<string, LessonProgress>): number {
  return Object.values(map).filter((p) => p.status === 'completed').length
}
