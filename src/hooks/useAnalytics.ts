import { useMemo } from 'react'
import { useSessionsStore } from '@/stores/sessionsStore'
import { analyze, filterSince, generateLearningPlanSafe, type RangeDays } from './analyticsBundle'
import type { PracticeContext } from '@/lessons/generators'

export type { RangeDays }

export function useAnalytics(range: RangeDays = 30) {
  const sessions = useSessionsStore((s) => s.sessions)

  const filtered = useMemo(() => filterSince(sessions, range), [sessions, range])
  const full = useMemo(() => analyze(filtered), [filtered])
  const plan = useMemo(() => generateLearningPlanSafe(filtered), [filtered])

  const practiceContext: PracticeContext = useMemo(
    () => ({
      problemKeys: full.summary.problemKeys,
      bigrams: full.patterns.bigrams,
      substitutions: full.patterns.substitutions,
      transpositions: full.patterns.transpositions,
      weakWords: full.summary.weakWords,
    }),
    [full],
  )

  return { sessions, filtered, ...full, plan, practiceContext }
}
