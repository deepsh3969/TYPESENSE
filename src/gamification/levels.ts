/** XP thresholds: cumulative XP required to *reach* a level. */
export function thresholdForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.round(200 * (level - 1) ** 1.7)
}

export interface LevelInfo {
  level: number
  title: string
  /** xp earned inside the current level */
  intoLevel: number
  /** xp needed for the current level band */
  bandSize: number
  /** 0..100 */
  progress: number
  totalXp: number
  toNext: number
}

const LEVEL_TITLES = [
  'Key Rookie',
  'Home Row Cadet',
  'Typist',
  'Rhythm Builder',
  'Speed Runner',
  'Word Weaver',
  'Keyboard Adept',
  'Rapid Typist',
  'Fluid Typist',
  'Touch Master',
  'Velocity Pro',
  'Keyboard Virtuoso',
]

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.max(0, level - 1))]
}

export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1
  while (thresholdForLevel(level + 1) <= totalXp && level < 99) level += 1
  const base = thresholdForLevel(level)
  const next = thresholdForLevel(level + 1)
  const bandSize = Math.max(1, next - base)
  const intoLevel = totalXp - base
  return {
    level,
    title: levelTitle(level),
    intoLevel,
    bandSize,
    progress: Math.max(0, Math.min(100, (intoLevel / bandSize) * 100)),
    totalXp: totalXp,
    toNext: Math.max(0, next - totalXp),
  }
}

/** XP awarded for completing a typing session. */
export function sessionXp(input: {
  seconds: number
  netWpm: number
  accuracy: number
  consistency: number
}): number {
  const minutes = input.seconds / 60
  const base = Math.round(minutes * 8)
  const speed = Math.round(input.netWpm * 0.6)
  const quality = input.accuracy >= 97 ? 25 : input.accuracy >= 94 ? 12 : input.accuracy >= 90 ? 5 : 0
  const rhythm = input.consistency >= 85 ? 10 : 0
  return Math.max(5, base + speed + quality + rhythm)
}

export const XP_REWARDS = {
  lesson: 60,
  dailyGoal: 30,
  streakDay: 5,
  achievementMultiplier: 1,
} as const
