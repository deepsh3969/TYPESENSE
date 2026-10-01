import type { Achievement, AchievementId, AchievementTier } from '@/types/gamification'

export interface AchievementContext {
  testsTaken: number
  bestWpm: number
  /** best session accuracy, RATIO 0..1 */
  bestAccuracy: number
  /** 0..100 */
  bestConsistency: number
  totalMinutes: number
  streakCurrent: number
  lessonsCompleted: number
  level1Completed: boolean
  level5Completed: boolean
  /** problem keys whose accuracy improved by >= 10 points */
  improvedKeys: number
  /** accuracy points gained on the most common error pattern */
  patternImprovement: number
  currentHour: number
  /** days inactive immediately before the most recent session */
  inactiveDays: number
}

export interface AchievementDefinition extends Achievement {
  check: (ctx: AchievementContext) => boolean
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-test',
    title: 'First Take',
    description: 'Complete your first typing test.',
    tier: 'bronze',
    xp: 25,
    icon: 'flag',
    check: (c) => c.testsTaken >= 1,
  },
  {
    id: 'wpm-20',
    title: '20 WPM',
    description: 'Reach a net speed of 20 WPM.',
    tier: 'bronze',
    xp: 30,
    icon: 'gauge',
    check: (c) => c.bestWpm >= 20,
  },
  {
    id: 'wpm-40',
    title: '40 WPM Club',
    description: 'Reach a net speed of 40 WPM.',
    tier: 'silver',
    xp: 60,
    icon: 'gauge',
    check: (c) => c.bestWpm >= 40,
  },
  {
    id: 'wpm-60',
    title: '60 WPM Club',
    description: 'Reach a net speed of 60 WPM.',
    tier: 'gold',
    xp: 120,
    icon: 'gauge',
    check: (c) => c.bestWpm >= 60,
  },
  {
    id: 'wpm-80',
    title: '80 WPM Club',
    description: 'Reach a net speed of 80 WPM.',
    tier: 'platinum',
    xp: 250,
    icon: 'gauge',
    check: (c) => c.bestWpm >= 80,
  },
  {
    id: 'acc-95',
    title: 'Sharpshooter',
    description: 'Finish a test with at least 95% accuracy.',
    tier: 'silver',
    xp: 60,
    icon: 'target',
    check: (c) => c.bestAccuracy >= 0.95,
  },
  {
    id: 'acc-100',
    title: 'Flawless',
    description: 'Finish a test with 100% accuracy.',
    tier: 'gold',
    xp: 150,
    icon: 'sparkles',
    check: (c) => c.bestAccuracy >= 1,
  },
  {
    id: 'streak-3',
    title: 'Warming Up',
    description: 'Practise 3 days in a row.',
    tier: 'bronze',
    xp: 40,
    icon: 'flame',
    check: (c) => c.streakCurrent >= 3,
  },
  {
    id: 'streak-7',
    title: '7 Day Streak',
    description: 'Practise 7 days in a row.',
    tier: 'silver',
    xp: 100,
    icon: 'flame',
    check: (c) => c.streakCurrent >= 7,
  },
  {
    id: 'streak-30',
    title: 'Unbreakable',
    description: 'Practise 30 days in a row.',
    tier: 'platinum',
    xp: 400,
    icon: 'flame',
    check: (c) => c.streakCurrent >= 30,
  },
  {
    id: 'minutes-100',
    title: '100 Minutes',
    description: 'Accumulate 100 minutes of practice.',
    tier: 'silver',
    xp: 80,
    icon: 'clock',
    check: (c) => c.totalMinutes >= 100,
  },
  {
    id: 'minutes-500',
    title: '500 Minutes',
    description: 'Accumulate 500 minutes of practice.',
    tier: 'gold',
    xp: 200,
    icon: 'clock',
    check: (c) => c.totalMinutes >= 500,
  },
  {
    id: 'problem-solver',
    title: 'Problem Solver',
    description: 'Improve the accuracy of 3 problem keys by 10+ points.',
    tier: 'gold',
    xp: 150,
    icon: 'wrench',
    check: (c) => c.improvedKeys >= 3,
  },
  {
    id: 'error-crusher',
    title: 'Error Crusher',
    description: 'Improve your most frequent error pattern by 15+ points.',
    tier: 'gold',
    xp: 150,
    icon: 'hammer',
    check: (c) => c.patternImprovement >= 15,
  },
  {
    id: 'consistency-master',
    title: 'Consistency Master',
    description: 'Finish a test with a consistency score of 90+.',
    tier: 'silver',
    xp: 90,
    icon: 'activity',
    check: (c) => c.bestConsistency >= 90,
  },
  {
    id: 'lesson-foundation',
    title: 'Foundation Laid',
    description: 'Complete every lesson in Level 1 — Keyboard Foundations.',
    tier: 'silver',
    xp: 100,
    icon: 'layers',
    check: (c) => c.level1Completed,
  },
  {
    id: 'lesson-mastery',
    title: 'Mastery Reached',
    description: 'Complete every lesson in Level 5 — Mastery.',
    tier: 'platinum',
    xp: 500,
    icon: 'crown',
    check: (c) => c.level5Completed,
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Finish a test between midnight and 4 AM.',
    tier: 'bronze',
    xp: 30,
    icon: 'moon',
    check: (c) => c.currentHour >= 0 && c.currentHour < 4 && c.testsTaken >= 1,
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Finish a test between 5 AM and 8 AM.',
    tier: 'bronze',
    xp: 30,
    icon: 'sunrise',
    check: (c) => c.currentHour >= 5 && c.currentHour < 8 && c.testsTaken >= 1,
  },
  {
    id: 'comeback',
    title: 'Comeback',
    description: 'Return to practise after a 7+ day break.',
    tier: 'bronze',
    xp: 50,
    icon: 'rotate-ccw',
    check: (c) => c.inactiveDays >= 7,
  },
]

export const ACHIEVEMENT_MAP: Record<AchievementId, AchievementDefinition> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
) as Record<AchievementId, AchievementDefinition>

export const TIER_LABEL: Record<AchievementTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
}

/** Returns achievements newly satisfied by the context. */
export function evaluateAchievements(
  ctx: AchievementContext,
  unlocked: { id: AchievementId }[],
): AchievementDefinition[] {
  const owned = new Set(unlocked.map((u) => u.id))
  return ACHIEVEMENTS.filter((a) => !owned.has(a.id) && a.check(ctx))
}
