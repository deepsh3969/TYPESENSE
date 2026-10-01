import { createId } from '@/lib/id'
import { roundAccuracy } from '@/lib/accuracy'
import type {
  ErrorCategory,
  KeystrokeEvent,
  KeyStat,
  TypingError,
  WpmSample,
} from '@/types/typing'
import { classifyError } from './classify'
import { computeLiveMetrics, computeMetrics, type LiveCounters, type LiveMetrics, type TimingData } from './metrics'
import { normalizeText } from './text'

export type SlotState = 'pending' | 'correct' | 'wrong'

export interface CharSlot {
  /** character currently occupying this slot (typed char, else expected) */
  char: string
  expected: string
  state: SlotState
}

interface InternalError {
  timestamp: number
  expected: string
  typed: string
  position: number
  word: string
  charIndex: number
  category: ErrorCategory
  corrected: boolean
  correctionMs: number | null
  timeToTypeMs: number
}

interface InternalKeyStat {
  attempts: number
  errors: number
  corrections: number
  totalDelayMs: number
  delaySamples: number
}

export interface EngineOptions {
  /** target text; whitespace is normalised inside the engine */
  text: string
  /** stop the session automatically after this many ms (timed tests) */
  durationLimitMs?: number
  /** injectable clock for tests */
  now?: () => number
  /** gap between keystrokes counted as a pause (default 1200ms) */
  pauseThresholdMs?: number
  /** slow char = delay > max(450ms, factor × mean delay) (default 1.8) */
  slowFactor?: number
}

interface WordSpan {
  text: string
  start: number
  end: number
}

const SLOW_RECORD_LIMIT = 100

/** Maps a character to its physical key (letters are case-insensitive). */
export function physicalKey(char: string): string {
  if (char === ' ') return 'space'
  if (char >= 'A' && char <= 'Z') return char.toLowerCase()
  return char
}

function emptySlot(expected: string): CharSlot {
  return { char: expected, expected, state: 'pending' }
}

/**
 * The typing engine: a framework-free state machine that consumes keystrokes
 * and produces slots (for rendering), events, error records, per-key stats
 * and timing samples. React only reads snapshots; it never drives the loop.
 */
export class TypingEngine {
  readonly text: string
  readonly durationLimitMs: number | undefined

  private readonly now: () => number
  private readonly pauseThresholdMs: number
  private readonly slowFactor: number

  private slotsState: CharSlot[]
  private indexValue = 0
  private startedAt: number | null = null
  private endAt: number | null = null
  private finishedFlag = false

  private correctKeystrokes = 0
  private totalKeystrokes = 0
  private correctSlots = 0
  private backspacePresses = 0
  private corrections = 0
  private uncorrectedErrors = 0

  private delays: number[] = []
  private wordTimes: number[] = []
  private pauses: number[] = []
  private delaySum = 0
  private delayCount = 0
  private lastPressAt: number | null = null
  private wordStartAt: number | null = null

  private errors: InternalError[] = []
  private errorByPosition = new Map<number, number>()
  private slowRecords = 0
  private wordErrorCounts = new Map<string, number>()
  private keyStats = new Map<string, InternalKeyStat>()
  private samples: WpmSample[] = []

  private spans: WordSpan[] = []
  private positionWord: string[] = []
  private positionWordIndex: number[] = []
  private wordEndingAt = new Map<number, number>()

  /** last accepted keystroke — used by the on-screen keyboard */
  lastKey: { char: string; correct: boolean } | null = null

  constructor(options: EngineOptions) {
    this.now = options.now ?? (() => performance.now())
    this.pauseThresholdMs = options.pauseThresholdMs ?? 1200
    this.slowFactor = options.slowFactor ?? 1.8
    this.durationLimitMs = options.durationLimitMs

    this.text = normalizeText(options.text)
    this.slotsState = this.text.split('').map((ch) => emptySlot(ch))
    this.indexValue = 0
    if (this.text.length === 0) this.finishedFlag = true

    this.buildWordIndex()
    this.positionWord = new Array(this.text.length).fill('')
    this.positionWordIndex = new Array(this.text.length).fill(0)
    for (let idx = 0; idx < this.spans.length; idx++) {
      const span = this.spans[idx]
      for (let i = span.start; i < span.end; i++) {
        this.positionWord[i] = span.text
        this.positionWordIndex[i] = idx
      }
      if (span.end < this.text.length && this.text[span.end] === ' ') {
        this.positionWord[span.end] = span.text
        this.positionWordIndex[span.end] = idx
      }
    }
  }

  // ------------------------------------------------------------------ layout

  private buildWordIndex(): void {
    let i = 0
    const text = this.text
    while (i < text.length) {
      if (text[i] === ' ') {
        i++
        continue
      }
      const start = i
      while (i < text.length && text[i] !== ' ') i++
      const span: WordSpan = { text: text.slice(start, i), start, end: i }
      this.spans.push(span)
      const wordIndex = this.spans.length - 1
      if (i < text.length && text[i] === ' ') this.wordEndingAt.set(i, wordIndex)
    }
  }

  private wordAt(position: number): string {
    if (position < 0 || position >= this.text.length) return ''
    if (this.text[position] === ' ') {
      const idx = this.wordEndingAt.get(position)
      if (idx !== undefined) return this.spans[idx].text
      // space that does not terminate a word (defensive)
      for (const span of this.spans) {
        if (position >= span.start && position <= span.end) return span.text
      }
      return ''
    }
    for (const span of this.spans) {
      if (position >= span.start && position < span.end) return span.text
      if (span.start > position) break
    }
    return ''
  }

  // ------------------------------------------------------------------ getters

  get index(): number {
    return this.indexValue
  }

  get slots(): readonly CharSlot[] {
    return this.slotsState
  }

  get started(): boolean {
    return this.startedAt !== null
  }

  get finished(): boolean {
    return this.finishedFlag
  }

  elapsed(now = this.now()): number {
    if (this.startedAt === null) return 0
    const end = this.endAt ?? now
    return Math.max(0, end - this.startedAt)
  }

  /** true when the session must stop (finished or time is up). */
  shouldStop(now = this.now()): boolean {
    if (this.finishedFlag) return true
    if (this.durationLimitMs && this.startedAt !== null && now - this.startedAt >= this.durationLimitMs) {
      this.finish(now)
      return true
    }
    return false
  }

  get counters(): LiveCounters {
    return {
      correctKeystrokes: this.correctKeystrokes,
      totalKeystrokes: this.totalKeystrokes,
      wrongKeystrokes: this.totalKeystrokes - this.correctKeystrokes,
      backspaces: this.backspacePresses,
      corrections: this.corrections,
      correctSlots: this.correctSlots,
      filledSlots: this.indexValue,
      uncorrectedErrors: this.uncorrectedErrors,
    }
  }

  get timing(): TimingData {
    return { delays: this.delays, wordTimes: this.wordTimes, pauses: this.pauses }
  }

  liveMetrics(now = this.now()): LiveMetrics {
    return computeLiveMetrics(this.counters, this.timing, this.elapsed(now))
  }

  getErrors(): InternalError[] {
    return this.errors
  }

  getKeyStats(): Map<string, InternalKeyStat> {
    return this.keyStats
  }

  getSamples(): WpmSample[] {
    return this.samples
  }

  // ------------------------------------------------------------------ input

  /** Accepts one printable character. Returns the event, or null if ignored. */
  press(rawChar: string): KeystrokeEvent | null {
    if (this.finishedFlag || this.text.length === 0) return null
    const char = normalizeChar(rawChar)
    if (char === null) return null

    const now = this.now()

    if (this.startedAt === null) {
      this.startedAt = now
      this.wordStartAt = now
    }
    if (this.durationLimitMs !== undefined && now - this.startedAt >= this.durationLimitMs) {
      this.finish(now)
      return null
    }
    if (this.indexValue >= this.text.length) {
      this.finish(now)
      return null
    }

    const position = this.indexValue
    const expected = this.text[position]
    const correct = char === expected
    const word = this.positionWord[position] ?? this.wordAt(position)

    // ---- timing -----------------------------------------------------
    let delay = 0
    if (this.lastPressAt !== null) {
      delay = now - this.lastPressAt
      if (delay > this.pauseThresholdMs) {
        this.pauses.push(delay)
      } else if (delay > 0) {
        this.delays.push(delay)
        this.delaySum += delay
        this.delayCount++
        const stat = this.keyStatFor(expected)
        stat.totalDelayMs += delay
        stat.delaySamples++
      }
    }
    this.lastPressAt = now

    // ---- slot + counters --------------------------------------------
    this.slotsState[position] = { char, expected, state: correct ? 'correct' : 'wrong' }
    this.totalKeystrokes++
    const keyStat = this.keyStatFor(expected)
    keyStat.attempts++

    if (correct) {
      this.correctKeystrokes++
      this.correctSlots++
      if (delay > 0) this.maybeRecordSlow(delay, char, expected, position, word)
    } else {
      this.recordError(char, expected, position, word, delay, now)
    }

    // ---- word completion --------------------------------------------
    if (expected === ' ') {
      const wordIdx = this.wordEndingAt.get(position)
      if (wordIdx !== undefined && this.wordStartAt !== null) {
        const duration = now - this.wordStartAt
        if (duration > 0 && duration < this.pauseThresholdMs) this.wordTimes.push(duration)
        this.wordStartAt = now
      }
    }

    const event: KeystrokeEvent = {
      t: now - (this.startedAt ?? now),
      expected,
      typed: char,
      correct,
      backspace: false,
      index: position,
      word,
      wordIndex: this.wordIndexFor(position),
    }
    this.lastKey = { char, correct }
    this.indexValue++

    // ---- completion ---------------------------------------------------
    if (this.indexValue >= this.text.length) {
      if (this.text[this.text.length - 1] !== ' ' && this.wordStartAt !== null) {
        const duration = now - this.wordStartAt
        if (duration > 0 && duration < this.pauseThresholdMs) this.wordTimes.push(duration)
      }
      this.finish(now)
    }

    return event
  }

  /** Removes characters. `wordwise` mimics ctrl/cmd+backspace. Returns #removed. */
  backspace(wordwise = false): number {
    if (this.finishedFlag || this.startedAt === null || this.indexValue === 0) return 0
    const now = this.now()
    let removed = 0

    const removeOne = (): boolean => {
      if (this.indexValue <= 0) return false
      const slot = this.slotsState[this.indexValue - 1]
      this.indexValue--
      if (slot.state === 'correct') {
        this.correctSlots--
      } else if (slot.state === 'wrong') {
        this.undoError(this.indexValue, now)
      }
      this.slotsState[this.indexValue] = emptySlot(this.text[this.indexValue])
      return true
    }

    if (wordwise) {
      // 1. consume trailing spaces (cursor sits right after a space)
      while (this.indexValue > 0 && this.slotsState[this.indexValue - 1].expected === ' ' && removeOne()) {
        removed++
      }
      // 2. consume the preceding word
      while (
        this.indexValue > 0 &&
        this.slotsState[this.indexValue - 1].expected !== ' ' &&
        removeOne()
      ) {
        removed++
      }
      if (removed === 0 && this.indexValue > 0 && removeOne()) removed++
    } else if (removeOne()) {
      removed++
    }

    if (removed > 0) {
      this.backspacePresses++
      this.lastKey = { char: 'backspace', correct: true }
    }
    return removed
  }

  /** Records a timeline sample; call from the render loop (~every 500ms). */
  sample(now = this.now()): void {
    if (this.startedAt === null) return
    const elapsed = this.elapsed(now)
    const live = computeLiveMetrics(this.counters, this.timing, elapsed)
    const t = Math.round((elapsed / 1000) * 10) / 10
    const last = this.samples[this.samples.length - 1]
    const accuracy = roundAccuracy(live.accuracy)
    if (last && last.t === t && last.wpm === live.wpm && last.accuracy === accuracy) return
    this.samples.push({ t, wpm: Math.round(live.wpm), accuracy })
  }

  finish(now = this.now()): void {
    if (this.finishedFlag) return
    this.finishedFlag = true
    this.endAt = this.startedAt !== null ? Math.min(now, this.startedAt + (this.durationLimitMs ?? Number.MAX_SAFE_INTEGER)) : now
    this.sample(now)
  }

  // ------------------------------------------------------------------ internals

  private wordIndexFor(position: number): number {
    return this.positionWordIndex[position] ?? 0
  }

  private keyStatFor(expected: string): InternalKeyStat {
    const key = physicalKey(expected)
    let stat = this.keyStats.get(key)
    if (!stat) {
      stat = { attempts: 0, errors: 0, corrections: 0, totalDelayMs: 0, delaySamples: 0 }
      this.keyStats.set(key, stat)
    }
    return stat
  }

  private recordError(
    typed: string,
    expected: string,
    position: number,
    word: string,
    delay: number,
    now: number,
  ): void {
    const prevExpected = position > 0 ? this.text[position - 1] : null
    const prevSlot = position > 0 ? this.slotsState[position - 1] : null
    const priorWordErrors = this.wordErrorCounts.get(word) ?? 0

    const category = classifyError({
      expected,
      typed,
      index: position,
      text: this.text,
      prevExpected,
      prevTyped: prevSlot ? prevSlot.char : null,
      prevWrong: prevSlot ? prevSlot.state === 'wrong' : false,
      priorWordErrors,
    })

    if (category === 'transposition' && position > 0) {
      const prevErrIdx = this.errorByPosition.get(position - 1)
      if (prevErrIdx !== undefined) this.errors[prevErrIdx].category = 'transposition'
    }

    const record: InternalError = {
      timestamp: now - (this.startedAt ?? now),
      expected,
      typed,
      position,
      word,
      charIndex: position,
      category,
      corrected: false,
      correctionMs: null,
      timeToTypeMs: Math.max(0, delay),
    }
    this.errors.push(record)
    this.errorByPosition.set(position, this.errors.length - 1)
    this.wordErrorCounts.set(word, priorWordErrors + 1)
    this.uncorrectedErrors++

    const stat = this.keyStatFor(expected)
    stat.errors++
  }

  private undoError(position: number, now: number): void {
    const idx = this.errorByPosition.get(position)
    if (idx === undefined) return
    const record = this.errors[idx]
    if (record.corrected || record.category === 'slow') return
    record.corrected = true
    record.correctionMs = Math.max(0, now - (this.startedAt ?? now) - record.timestamp)
    this.corrections++
    this.uncorrectedErrors = Math.max(0, this.uncorrectedErrors - 1)
    this.keyStatFor(record.expected).corrections++
  }

  private maybeRecordSlow(delay: number, typed: string, expected: string, position: number, word: string): void {
    if (this.delayCount < 2 || this.slowRecords >= SLOW_RECORD_LIMIT) return
    const mean = this.delaySum / this.delayCount
    const threshold = Math.max(450, mean * this.slowFactor)
    if (delay <= threshold) return
    this.slowRecords++
    this.errors.push({
      timestamp: delay,
      expected,
      typed,
      position,
      word,
      charIndex: position,
      category: 'slow',
      corrected: false,
      correctionMs: null,
      timeToTypeMs: delay,
    })
  }
}

/** Normalises an incoming key into a single printable char, or null to ignore. */
export function normalizeChar(input: string): string | null {
  if (input === 'Spacebar') return ' '
  if (input.length !== 1) return null
  const code = input.charCodeAt(0)
  if (code === 32) return ' '
  if (code < 33 || code > 126) return null
  return input
}

// ---------------------------------------------------------------- finalisation

export interface SessionMeta {
  id: string
  userId: string | null
  sessionId?: string
  mode: import('@/types/typing').TypingMode
  source: import('@/types/typing').SessionSource
  practiceMode?: string
  lessonId?: string | null
  target: number
  startedAtIso: string
  finishedAtIso: string
}

/** Converts a finished engine into a persistable session record. */
export function finalizeSession(engine: TypingEngine, meta: SessionMeta): import('@/types/typing').TypingSession {
  const counters = engine.counters
  const metrics = computeMetrics(counters, engine.timing, engine.elapsed())
  const allErrors = engine.getErrors()
  const mistakeRecords = allErrors.filter((e) => e.category !== 'slow')

  metrics.errors = mistakeRecords.length
  metrics.extraChars = mistakeRecords.filter((e) => e.category === 'extra').length
  metrics.missedChars = mistakeRecords.filter((e) => e.category === 'missing').length
  metrics.uncorrectedErrors = mistakeRecords.filter((e) => !e.corrected).length

  const keyStats: KeyStat[] = [...engine.getKeyStats().entries()].map(([key, s]) => ({
    key,
    attempts: s.attempts,
    errors: s.errors,
    corrections: s.corrections,
    totalDelayMs: s.totalDelayMs,
    delaySamples: s.delaySamples,
  }))

  const sessionId = meta.sessionId ?? meta.id
  const errors: TypingError[] = allErrors.map((e) => ({
    id: createId('err'),
    sessionId,
    timestamp: Math.round(e.timestamp),
    expected: e.expected,
    typed: e.typed,
    position: e.position,
    word: e.word,
    charIndex: e.charIndex,
    category: e.category,
    corrected: e.corrected,
    correctionMs: e.correctionMs === null ? null : Math.round(e.correctionMs),
    timeToTypeMs: Math.round(e.timeToTypeMs),
  }))

  return {
    id: meta.id,
    userId: meta.userId,
    mode: meta.mode,
    source: meta.source,
    practiceMode: meta.practiceMode,
    lessonId: meta.lessonId ?? null,
    target: meta.target,
    text: engine.text,
    startedAt: meta.startedAtIso,
    finishedAt: meta.finishedAtIso,
    metrics,
    keyStats,
    errors,
    timeline: engine.getSamples(),
  }
}
