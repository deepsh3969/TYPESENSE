import {
  LayoutDashboard,
  Dumbbell,
  Keyboard,
  SpellCheck,
  GitCompareArrows,
  Timer,
  GraduationCap,
  Bug,
  LineChart,
  Trophy,
  User,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export const mainNav: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', to: '/app', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Practice',
    items: [
      { label: 'Quick Practice', to: '/app/practice', icon: Dumbbell, end: true },
      { label: 'Problem Keys', to: '/app/practice/problem-keys', icon: Keyboard },
      { label: 'Weak Words', to: '/app/practice/weak-words', icon: SpellCheck },
      { label: 'Combinations', to: '/app/practice/combinations', icon: GitCompareArrows },
    ],
  },
  {
    items: [
      { label: 'Typing Test', to: '/app/test', icon: Timer },
      { label: 'Lessons', to: '/app/lessons', icon: GraduationCap },
      { label: 'Mistakes', to: '/app/mistakes', icon: Bug },
      { label: 'Progress', to: '/app/progress', icon: LineChart },
      { label: 'Achievements', to: '/app/achievements', icon: Trophy },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', to: '/app/profile', icon: User },
      { label: 'Settings', to: '/app/settings', icon: Settings },
    ],
  },
]

export const mobileNav: NavItem[] = [
  { label: 'Home', to: '/app', icon: LayoutDashboard, end: true },
  { label: 'Test', to: '/app/test', icon: Timer },
  { label: 'Practice', to: '/app/practice', icon: Dumbbell },
  { label: 'Lessons', to: '/app/lessons', icon: GraduationCap },
  { label: 'Progress', to: '/app/progress', icon: LineChart },
]
