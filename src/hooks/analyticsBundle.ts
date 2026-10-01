export { analyze, filterSince, dailySeries, windowDelta, keyAccuracyFor, type RangeDays, type DailyPoint } from '@/analytics/summarize'
export { generateLearningPlan } from '@/analytics/learningPlan'
export { computeProblemKeys, weakKeys, statusFor } from '@/analytics/problemKeys'
export type { FullAnalysis } from '@/analytics/summarize'

import type { SessionLike } from '@/types/typing'
import type { LearningPlan } from '@/types/analytics'
import { generateLearningPlan } from '@/analytics/learningPlan'

/** Learning plan with a graceful null for empty histories. */
export function generateLearningPlanSafe(sessions: readonly SessionLike[]): LearningPlan | null {
  if (sessions.length === 0) return null
  return generateLearningPlan(sessions)
}
