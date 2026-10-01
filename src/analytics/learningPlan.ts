import type { FocusItem, LearningPlan, ProblemKey, ProblemPattern, WordStat } from '@/types/analytics'
import type { SessionLike } from '@/types/typing'
import { aggregateKeyStats, computeProblemKeys, weakKeys } from './problemKeys'
import { analyzePatterns, analyzeWords, biggestPattern, weakWords } from './patterns'

function attemptMap(sessions: readonly SessionLike[]): ReadonlyMap<string, number> {
  const out = new Map<string, number>()
  for (const [key, agg] of aggregateKeyStats(sessions)) out.set(key, agg.attempts)
  return out
}

function punctuationPressure(sessions: readonly SessionLike[]): boolean {
  let punctErrors = 0
  let punctAttempts = 0
  for (const s of sessions) {
    for (const e of s.errors) {
      if (e.category === 'punctuation') punctErrors++
    }
    for (const k of s.keyStats) {
      if (/^[.,;:!?'()\-]$/.test(k.key)) punctAttempts += k.attempts
    }
  }
  if (punctAttempts < 25) return false
  return punctErrors / punctAttempts > 0.05
}

function numberPressure(sessions: readonly SessionLike[]): boolean {
  let numberErrors = 0
  let numberAttempts = 0
  for (const s of sessions) {
    numberErrors += s.errors.filter((e) => e.category === 'number').length
    for (const k of s.keyStats) {
      if (/^[0-9]$/.test(k.key)) numberAttempts += k.attempts
    }
  }
  if (numberAttempts < 25) return false
  return numberErrors / numberAttempts > 0.05
}

/**
 * Phase 9 — the Personalized Learning Engine.
 *
 * Turns raw sessions into "Today's focus": an ordered, evidence-backed list of
 * things to practise, each with an action the Practice page can execute.
 * Returns null when there is no evidence yet.
 */
export function generateLearningPlan(sessions: readonly SessionLike[]): LearningPlan | null {
  if (sessions.length === 0) return null

  const problemKeys = computeProblemKeys(sessions)
  const keyAttempts = attemptMap(sessions)
  const analysis = analyzePatterns(sessions, keyAttempts)
  const topPattern = biggestPattern(analysis)
  const weakKeysList = weakKeys(problemKeys, 5)
  const words = weakWords(analyzeWords(sessions), 6)

  const focus: FocusItem[] = []
  let headline = 'Retest and measure progress'

  // 1. biggest combination problem
  if (topPattern) {
    focus.push({
      id: 'pattern',
      label: `Fix “${topPattern.expected}”`,
      detail: `${topPattern.accuracy}% accuracy across ${topPattern.attempts} attempts — often typed as “${topPattern.actual || topPattern.expected}”.`,
      priority: 100,
      action: 'practice-pattern',
      target: topPattern.id,
      icon: 'pattern',
    })
    headline = `Fix “${topPattern.expected}”`
  }

  // 2. worst keys
  weakKeysList.slice(0, 3).forEach((key, i) => {
    focus.push({
      id: `key-${key.key}`,
      label: i === 0 && !topPattern ? `Fix “${key.key.toUpperCase()}”` : `Sharpen the “${key.key.toUpperCase()}” key`,
      detail: `${key.accuracy}% accuracy · ${key.errors} errors over ${key.attempts} attempts.`,
      priority: (topPattern ? 90 : 100) - i * 6,
      action: 'practice-key',
      target: key.key,
      icon: 'key',
    })
    if (!topPattern && i === 0) headline = `Fix “${key.key.toUpperCase()}”`
  })

  // 3. weak words
  if (words.length > 0) {
    focus.push({
      id: 'words',
      label: 'Drill your weak words',
      detail: `${words.slice(0, 3).map((w) => w.word).join(', ')}${words.length > 3 ? '…' : ''} keep slipping.`,
      priority: 72,
      action: 'practice-words',
      target: words.map((w) => w.word).join(','),
      icon: 'words',
    })
  }

  // 4. punctuation / numbers pressure
  if (punctuationPressure(sessions)) {
    focus.push({
      id: 'punctuation',
      label: 'Practice punctuation',
      detail: 'Punctuation keys are costing you more than 5% of your keystrokes.',
      priority: 64,
      action: 'practice-punctuation',
      target: 'punctuation',
      icon: 'punct',
    })
  } else if (numberPressure(sessions)) {
    focus.push({
      id: 'numbers',
      label: 'Practice numbers',
      detail: 'Number-row errors are showing up in your recent sessions.',
      priority: 62,
      action: 'practice-key',
      target: 'numbers',
      icon: 'punct',
    })
  }

  // 5. always finish with a retest
  focus.push({
    id: 'retest',
    label: 'Retest to measure improvement',
    detail: 'Run a 60-second test and compare against your last baseline.',
    priority: 50,
    action: 'retest',
    target: 'test',
    icon: 'test',
  })

  focus.sort((a, b) => b.priority - a.priority)

  return {
    generatedAt: new Date().toISOString(),
    headline,
    focus,
    biggestPattern: topPattern,
    problemKeys: filterRelevant(problemKeys),
    weakWords: words,
  }
}

function filterRelevant(keys: ProblemKey[]): ProblemKey[] {
  return keys.filter((k) => k.key !== 'space' && k.attempts >= 8).slice(0, 6)
}

export type { FocusItem, LearningPlan, ProblemKey, ProblemPattern, WordStat }
