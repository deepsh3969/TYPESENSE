export const PAGE_TITLES: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/test': 'Typing Test',
  '/app/practice': 'Practice',
  '/app/lessons': 'Lessons',
  '/app/mistakes': 'Mistakes',
  '/app/progress': 'Progress',
  '/app/achievements': 'Achievements',
  '/app/profile': 'Profile',
  '/app/settings': 'Settings',
}

export const DEFAULT_PAGE_TITLE = 'Dashboard'

export function titleFor(pathname: string): string {
  const exact = PAGE_TITLES[pathname]
  if (exact) return exact
  if (pathname.startsWith('/app/practice/')) return 'Practice Drill'
  if (pathname.startsWith('/app/lessons/')) return 'Lesson'
  return DEFAULT_PAGE_TITLE
}
