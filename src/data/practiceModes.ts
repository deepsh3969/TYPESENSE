import type { PracticeMode } from '@/types/profile'

export const PRACTICE_MODES: PracticeMode[] = [
  {
    id: 'problem-keys',
    title: 'Problem Keys',
    description: 'Isolated drills for the keys your analysis flagged as weak.',
    icon: 'keyboard',
    accent: 'indigo',
  },
  {
    id: 'combinations',
    title: 'Key Combinations',
    description: 'Bigrams and trigrams you keep fumbling, over and over.',
    icon: 'merge',
    accent: 'cyan',
  },
  {
    id: 'weak-words',
    title: 'Weak Words',
    description: 'The specific words that break your rhythm in tests.',
    icon: 'spell-check',
    accent: 'green',
  },
  {
    id: 'speed-drill',
    title: 'Speed Drill',
    description: 'Short burst of common words — push the pace for 30 seconds.',
    icon: 'zap',
    accent: 'amber',
  },
  {
    id: 'accuracy-drill',
    title: 'Accuracy Drill',
    description: 'Slow, deliberate typing with tricky words. Clean beats fast.',
    icon: 'target',
    accent: 'green',
  },
  {
    id: 'precision',
    title: 'Precision Mode',
    description: 'Seeded with your own mistakes — accuracy of 97%+ required.',
    icon: 'crosshair',
    accent: 'rose',
  },
  {
    id: 'flow',
    title: 'Flow Mode',
    description: 'Long natural passages for building rhythm and stamina.',
    icon: 'waves',
    accent: 'indigo',
  },
  {
    id: 'punctuation',
    title: 'Punctuation',
    description: 'Quotes, brackets, dashes, and sentence-ending symbols.',
    icon: 'pilcrow',
    accent: 'cyan',
  },
  {
    id: 'numbers',
    title: 'Numbers',
    description: 'The number row, dates, quantities, and reference codes.',
    icon: 'hash',
    accent: 'amber',
  },
  {
    id: 'custom',
    title: 'Custom Practice',
    description: 'Paste any text you want and drill it your way.',
    icon: 'file-text',
    accent: 'indigo',
  },
]

export const PRACTICE_MODE_MAP: Record<string, PracticeMode> = Object.fromEntries(
  PRACTICE_MODES.map((m) => [m.id, m]),
)

/** Modes that run against a timer instead of a fixed text. */
export const TIMED_PRACTICE: Record<string, number> = {
  'speed-drill': 30,
}
