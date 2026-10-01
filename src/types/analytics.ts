import type { ErrorCategory } from './typing'

export type KeyStatus = 'strong' | 'good' | 'needs-practice' | 'critical'

/** Normalised, confidence-weighted health of a single key. */
export interface ProblemKey {
  key: string
  attempts: number
  errors: number
  corrections: number
  /** 1 - errors/attempts — RATIO 0..1 */
  accuracy: number
  /** RATIO 0..1 (complement of accuracy) */
  errorRate: number
  avgResponseMs: number
  /** 0..1 — how much evidence we have (attempts, recency) */
  confidence: number
  /** 0..100 — lower is worse; combines accuracy, speed and evidence */
  score: number
  status: KeyStatus
}

export type PatternKind =
  | 'bigram'
  | 'trigram'
  | 'word'
  | 'prefix'
  | 'suffix'
  | 'substitution'
  | 'transposition'

export interface ProblemPattern {
  id: string
  kind: PatternKind
  /** what should have been typed */
  expected: string
  /** what was typed instead ("" for accuracy-only failures) */
  actual: string
  attempts: number
  errors: number
  /** RATIO 0..1 */
  accuracy: number
  avgDelayMs: number
  confidence: number
  /** human readable suggestion shown in the UI */
  recommendation: string
  /** error category this pattern mostly belongs to */
  category: ErrorCategory
}

export interface WordStat {
  word: string
  attempts: number
  errors: number
  /** RATIO 0..1 */
  accuracy: number
  avgTimeMs: number
}

export interface FocusItem {
  id: string
  label: string
  detail: string
  /** 0..100 priority */
  priority: number
  action: 'practice-key' | 'practice-pattern' | 'practice-words' | 'practice-punctuation' | 'retest'
  /** payload for the action (key, pattern id, etc.) */
  target: string
  icon: 'key' | 'words' | 'pattern' | 'punct' | 'test'
}

export interface LearningPlan {
  generatedAt: string
  /** headline shown on the dashboard, e.g. `Fix "R"` */
  headline: string
  focus: FocusItem[]
  /** strongest evidence-backed weakness */
  biggestPattern: ProblemPattern | null
  problemKeys: ProblemKey[]
  weakWords: WordStat[]
}

/** Aggregated analytics over a set of sessions. */
export interface AnalyticsSummary {
  sessions: number
  totalSeconds: number
  avgWpm: number
  bestWpm: number
  /** RATIO 0..1 (session-level average of ratios) */
  avgAccuracy: number
  avgConsistency: number
  /** percentage-point change of first vs last half of the window */
  wpmDelta: number
  /** percentage-point change (ratio delta ×100, via accuracyToPercent) */
  accuracyDelta: number
  problemKeys: ProblemKey[]
  patterns: ProblemPattern[]
  weakWords: WordStat[]
}
