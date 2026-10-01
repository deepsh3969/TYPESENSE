import { describe, expect, it } from 'vitest'
import type { SessionLike, TypingError } from '@/types/typing'
import { computeProblemKeys, weakKeys } from './problemKeys'
import {
  analyzeNgrams,
  analyzeSubstitutions,
  analyzeTranspositions,
  analyzeWords,
  biggestPattern,
  weakWords,
} from './patterns'
import { generateLearningPlan } from './learningPlan'
import { analyze, windowDelta } from './summarize'

function errorAt(
  position: number,
  expected: string,
  typed: string,
  word: string,
  category: TypingError['category'] = 'wrong-key',
): TypingError {
  return {
    id: `e${position}${typed}`,
    sessionId: 's',
    timestamp: 100,
    expected,
    typed,
    position,
    word,
    charIndex: position,
    category,
    corrected: false,
    correctionMs: null,
    timeToTypeMs: 400,
  }
}

function makeSession(input: {
  text: string
  keyStats?: SessionLike['keyStats']
  errors?: TypingError[]
  startedAt?: string
}): SessionLike {
  return {
    text: input.text,
    keyStats: input.keyStats ?? [],
    errors: input.errors ?? [],
    startedAt: input.startedAt ?? '2026-09-01T10:00:00.000Z',
    metrics: {
      elapsedMs: 60_000,
      wpm: 50,
      grossWpm: 55,
      netWpm: 48,
      cpm: 275,
      accuracy: 95,
      errors: input.errors?.length ?? 0,
      uncorrectedErrors: 0,
      correctChars: 300,
      incorrectChars: 5,
      extraChars: 0,
      missedChars: 0,
      backspaces: 4,
      corrections: 4,
      correctionRate: 100,
      avgKeyDelayMs: 200,
      avgWordTimeMs: 900,
      avgPauseMs: 1500,
      consistency: 80,
      finalAccuracy: 98,
    },
  }
}

describe('problem key detection (Phase 7)', () => {
  it('ranks by normalised accuracy, not raw error count', () => {
    // 'e' typed 500 times with 30 errors (94%) — healthy but high volume
    // 'r' typed 20 times with 8 errors (60%) — genuinely broken
    const sessions = [
      makeSession({
        text: 'some long text',
        keyStats: [
          { key: 'e', attempts: 500, errors: 30, corrections: 25, totalDelayMs: 50_000, delaySamples: 500 },
          { key: 'r', attempts: 20, errors: 8, corrections: 6, totalDelayMs: 12_000, delaySamples: 20 },
        ],
      }),
    ]

    const keys = computeProblemKeys(sessions)
    const r = keys.find((k) => k.key === 'r')!
    const e = keys.find((k) => k.key === 'e')!

    expect(r.accuracy).toBeCloseTo(60, 0)
    expect(e.accuracy).toBeCloseTo(94, 0)
    expect(r.score).toBeLessThan(e.score)
    expect(keys[0].key).toBe('r')
    expect(r.status).toBe('critical')
    expect(e.status).toBe('good')
    expect(r.confidence).toBeLessThan(1)
    expect(r.confidence).toBeGreaterThan(0)
  })

  it('skips keys without enough evidence from the weak list', () => {
    const sessions = [
      makeSession({
        text: 'x',
        keyStats: [{ key: 'x', attempts: 3, errors: 2, corrections: 0, totalDelayMs: 600, delaySamples: 3 }],
      }),
    ]
    const keys = computeProblemKeys(sessions)
    expect(keys).toHaveLength(1)
    expect(weakKeys(keys)).toHaveLength(0) // only 3 attempts — not enough evidence
  })

  it('merges stats across sessions', () => {
    const sessions = [
      makeSession({ text: 'rr', keyStats: [{ key: 'r', attempts: 10, errors: 5, corrections: 2, totalDelayMs: 2000, delaySamples: 10 }] }),
      makeSession({ text: 'rr', keyStats: [{ key: 'r', attempts: 10, errors: 1, corrections: 1, totalDelayMs: 2000, delaySamples: 10 }] }),
    ]
    const r = computeProblemKeys(sessions).find((k) => k.key === 'r')!
    expect(r.attempts).toBe(20)
    expect(r.errors).toBe(6)
    expect(r.accuracy).toBeCloseTo(70, 0)
  })
})

describe('pattern analysis (Phase 8)', () => {
  it('detects th → ht transpositions', () => {
    const text = 'the thin path that'
    const errors = [
      errorAt(0, 't', 'h', 'the', 'wrong-key'),
      errorAt(1, 'h', 't', 'the', 'transposition'),
      errorAt(4, 't', 'h', 'thin', 'wrong-key'),
      errorAt(5, 'h', 't', 'thin', 'transposition'),
    ]
    const sessions = [makeSession({ text, errors })]
    const patterns = analyzeTranspositions(sessions)
    const th = patterns.find((p) => p.expected === 'th')
    expect(th).toBeDefined()
    expect(th!.actual).toBe('ht')
    expect(th!.errors).toBe(2)
    expect(th!.attempts).toBe(4)
    expect(th!.accuracy).toBe(50)
  })

  it('computes bigram accuracy from occurrences vs failures', () => {
    const text = 'the theme there thin'
    // mistake at position 1 breaks bigrams "th" (0-1) and "he" (1-2)
    const errors = [errorAt(1, 'h', 't', 'the')]
    const patterns = analyzeNgrams([makeSession({ text, errors })], 2)
    const th = patterns.find((p) => p.expected === 'th')!
    expect(th.attempts).toBe(4)
    expect(th.errors).toBe(1)
    expect(th.accuracy).toBe(75)
  })

  it('builds substitution patterns from expected→typed pairs', () => {
    const sessions = [
      makeSession({
        text: 'run run run run run run run run run run',
        keyStats: [{ key: 'r', attempts: 40, errors: 18, corrections: 5, totalDelayMs: 8000, delaySamples: 40 }],
        errors: Array.from({ length: 18 }, (_, i) => errorAt(i, 'r', 't', 'run')),
      }),
    ]
    const patterns = analyzeSubstitutions(
      sessions,
      new Map([['r', 40]]),
    )
    const rt = patterns.find((p) => p.expected === 'r' && p.actual === 't')
    expect(rt).toBeDefined()
    expect(rt!.errors).toBe(18)
    expect(rt!.accuracy).toBeCloseTo(55, 0)
    expect(rt!.recommendation).toContain('r')
  })

  it('scores word occurrences, not raw error counts', () => {
    const text = 'cat cat cat dog'
    // two errors inside the FIRST occurrence of "cat" still counts once
    const errors = [errorAt(1, 'a', 's', 'cat'), errorAt(2, 't', 'a', 'cat')]
    const words = analyzeWords([makeSession({ text, errors })])
    const cat = words.find((w) => w.word === 'cat')!
    expect(cat.attempts).toBe(3)
    expect(cat.errors).toBe(1)
    expect(cat.accuracy).toBeCloseTo(66.7, 1)
    const dog = words.find((w) => w.word === 'dog')!
    expect(dog.errors).toBe(0)
    expect(weakWords(words)).toHaveLength(1)
  })

  it('picks the highest-risk combination as the biggest pattern', () => {
    const text = 'the thin three there through that the thin three there'
    const errors = [
      errorAt(1, 'h', 't', 'the'),
      errorAt(16, 'e', 'h', 'there'),
      errorAt(39, 'i', 'n', 'thin'),
      errorAt(44, 'e', 'h', 'three'),
    ]
    const sessions = [makeSession({ text, errors })]
    const bigrams = analyzeNgrams(sessions, 2)
    const biggest = biggestPattern({ bigrams, trigrams: [], substitutions: [], transpositions: [], prefixes: [], suffixes: [] })
    expect(biggest).not.toBeNull()
    expect(biggest!.expected).toBe('th')
    expect(biggest!.accuracy).toBe(60)
  })
})

describe('learning plan (Phase 9)', () => {
  it('returns null without evidence', () => {
    expect(generateLearningPlan([])).toBeNull()
  })

  it('builds an ordered focus list from real mistakes', () => {
    const text = 'the thin tree has three paths'
    const errors = [
      errorAt(1, 'h', 't', 'the', 'wrong-key'),
      errorAt(2, 'e', 'h', 'the', 'transposition'),
      errorAt(6, 'h', 't', 'thin', 'wrong-key'),
      errorAt(11, 'r', 't', 'tree', 'wrong-key'),
      errorAt(17, 'h', 't', 'three', 'wrong-key'),
      errorAt(24, 'h', 't', 'paths', 'wrong-key'),
    ]
    const sessions = [
      makeSession({
        text,
        errors,
        keyStats: [
          { key: 't', attempts: 30, errors: 6, corrections: 4, totalDelayMs: 9000, delaySamples: 30 },
          { key: 'h', attempts: 28, errors: 8, corrections: 5, totalDelayMs: 14000, delaySamples: 28 },
          { key: 'e', attempts: 40, errors: 2, corrections: 2, totalDelayMs: 6000, delaySamples: 40 },
        ],
      }),
    ]

    const plan = generateLearningPlan(sessions)!
    expect(plan).not.toBeNull()
    expect(plan.headline).toContain('Fix')
    expect(plan.focus.length).toBeGreaterThanOrEqual(2)
    expect(plan.focus[plan.focus.length - 1].action).toBe('retest')
    const actions = plan.focus.map((f) => f.action)
    expect(actions).toContain('practice-key')
    for (const item of plan.focus) {
      expect(item.priority).toBeGreaterThan(0)
      expect(item.detail.length).toBeGreaterThan(0)
    }
    // priorities are sorted descending
    const priorities = plan.focus.map((f) => f.priority)
    expect([...priorities].sort((a, b) => b - a)).toEqual(priorities)
  })
})

describe('summarize (Phase 15 support)', () => {
  it('computes window deltas between first and second halves', () => {
    const sessions = [30, 32, 34, 40].map((wpm, i) => {
      const s = makeSession({ text: 'x', startedAt: `2026-09-0${i + 1}T10:00:00.000Z` })
      s.metrics = { ...s.metrics, wpm }
      return s as unknown as import('@/types/typing').TypingSession
    })
    const delta = windowDelta(sessions)
    expect(delta.wpmDelta).toBeCloseTo(6, 1) // (40+34)/2 − (30+32)/2
  })

  it('analyzes empty lists without throwing', () => {
    const result = analyze([])
    expect(result.summary.sessions).toBe(0)
    expect(result.summary.avgWpm).toBe(0)
    expect(result.topPattern).toBeNull()
  })
})
