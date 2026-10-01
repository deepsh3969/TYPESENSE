/** How a typing session is scoped. */
export type TypingMode = 'time' | 'words' | 'custom' | 'lesson' | 'practice'

export type SessionSource = 'test' | 'practice' | 'lesson'

export type Difficulty = 1 | 2 | 3 | 4 | 5

/** A single captured keystroke with full context. */
export interface KeystrokeEvent {
  /** ms since session start */
  t: number
  /** expected character (empty string for extra characters) */
  expected: string
  /** character the user actually typed */
  typed: string
  correct: boolean
  /** was this keystroke a backspace */
  backspace: boolean
  /** index of the affected character in the target text */
  index: number
  /** the word the index belongs to */
  word: string
  wordIndex: number
}

export type ErrorCategory =
  | 'wrong-key'
  | 'missing'
  | 'extra'
  | 'transposition'
  | 'repeated-word'
  | 'punctuation'
  | 'capitalization'
  | 'number'
  | 'space'
  | 'slow'

export const ERROR_CATEGORIES: ErrorCategory[] = [
  'wrong-key',
  'missing',
  'extra',
  'transposition',
  'repeated-word',
  'punctuation',
  'capitalization',
  'number',
  'space',
  'slow',
]

/** One analysed mistake, persisted for the Mistake Lab. */
export interface TypingError {
  id: string
  sessionId: string
  /** ms from session start */
  timestamp: number
  expected: string
  typed: string
  /** character offset in the target text */
  position: number
  word: string
  charIndex: number
  category: ErrorCategory
  corrected: boolean
  /** ms between the mistake and its correction (when corrected) */
  correctionMs: number | null
  /** ms spent typing the offending character */
  timeToTypeMs: number
}

export interface KeyStat {
  key: string
  attempts: number
  errors: number
  corrections: number
  totalDelayMs: number
  /** number of delays, for averaging */
  delaySamples: number
}

export interface WpmSample {
  /** seconds elapsed */
  t: number
  wpm: number
  /** ratio 0..1 */
  accuracy: number
}

/** All derived metrics for one session (see src/typing/metrics.ts for formulas). */
export interface SessionMetrics {
  elapsedMs: number
  /** headline speed: (correct characters / 5) / elapsed minutes */
  wpm: number
  grossWpm: number
  netWpm: number
  cpm: number
  /** first-attempt keystroke accuracy, RATIO 0..1 (display with @/lib/accuracy) */
  accuracy: number
  errors: number
  uncorrectedErrors: number
  correctChars: number
  incorrectChars: number
  extraChars: number
  missedChars: number
  backspaces: number
  corrections: number
  /** corrections / (corrections + uncorrectedErrors), RATIO 0..1 (separate metric from accuracy) */
  correctionRate: number
  /** mean ms between keystrokes, excluding pauses > 1200ms */
  avgKeyDelayMs: number
  /** ms between word completions */
  avgWordTimeMs: number
  /** mean pause length where a pause is > 1200ms */
  avgPauseMs: number
  /** 0..100, inverse coefficient of variation of key delays */
  consistency: number
  /** accuracy of the final (uncorrected) text vs target, RATIO 0..1 */
  finalAccuracy: number
}

export interface TypingSession {
  id: string
  userId: string | null
  mode: TypingMode
  source: SessionSource
  /** practice mode id when source === 'practice' */
  practiceMode?: string
  lessonId?: string | null
  /** word count target for words mode, otherwise duration in ms */
  target: number
  text: string
  startedAt: string
  finishedAt: string
  metrics: SessionMetrics
  keyStats: KeyStat[]
  errors: TypingError[]
  timeline: WpmSample[]
}

export type TestConfig =
  | { mode: 'time'; seconds: 15 | 30 | 60 | 120 | 300 }
  | { mode: 'words'; words: 10 | 25 | 50 | 100 }
  | { mode: 'custom'; text: string }

/** The subset of a session the analytics engines consume. */
export interface SessionLike {
  text: string
  errors: TypingError[]
  keyStats: KeyStat[]
  metrics: SessionMetrics
  startedAt: string
}
