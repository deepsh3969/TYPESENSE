import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, KeyboardIcon, Moon, Sun, UserRound, LogOut, Settings as SettingsIcon, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { useUserStore } from '@/stores/userStore'
import { displayedStreak, goalProgress } from '@/gamification/streaks'
import { levelFromXp } from '@/gamification/levels'
import { ProgressRing } from '@/components/ui'

const AVATAR_EMOJI: Record<string, string> = {
  keyboard: '⌨️',
  zap: '⚡',
  target: '🎯',
  rocket: '🚀',
  brain: '🧠',
  sparkles: '✨',
}

export function TopBar() {
  const { setTheme } = useTheme()
  const data = useUserStore((s) => s.data)
  const streak = displayedStreak(data.streak)
  const goal = goalProgress(data.dailyGoal)
  const level = levelFromXp(data.profile.xp)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const isDark = document.documentElement.dataset.theme === 'dark'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md sm:px-6">
      <Link to="/" className="flex items-center gap-2 lg:hidden" aria-label="TypeSense home">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
          <KeyboardIcon className="size-4" aria-hidden />
        </span>
        <span className="text-sm font-extrabold tracking-tight">
          TYPE<span className="text-primary">SENSE</span>
        </span>
      </Link>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2 sm:gap-3">
        {/* streak */}
        <div
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm font-bold"
          title={`${streak}-day streak`}
        >
          <Flame className={cn('size-4', streak > 0 ? 'text-warning' : 'text-ink-faint')} aria-hidden />
          <span className={streak > 0 ? 'text-ink' : 'text-ink-faint'}>{streak}</span>
          <span className="sr-only">day streak</span>
        </div>

        {/* daily goal */}
        <Link
          to="/app/progress"
          className="hidden items-center gap-2 rounded-full border border-line bg-surface-2 py-1 pl-1 pr-3 transition-colors hover:border-primary/40 sm:flex"
          title={`${Math.round(data.dailyGoal.minutes)} / ${data.dailyGoal.goalMinutes} min today`}
        >
          <ProgressRing value={goal} size={30} stroke={3.5}>
            <span className="text-[9px] font-bold text-ink">{Math.round(goal)}</span>
          </ProgressRing>
          <span className="text-xs font-semibold text-ink-muted">
            {Math.round(data.dailyGoal.minutes)}/{data.dailyGoal.goalMinutes}m
          </span>
        </Link>

        {/* theme */}
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="flex size-9 items-center justify-center rounded-full border border-line bg-surface-2 text-ink-muted transition-colors hover:text-ink"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {/* avatar menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex size-9 items-center justify-center rounded-full border-2 border-line bg-primary/10 text-lg transition-transform hover:scale-105"
            aria-label="Open profile menu"
          >
            <span aria-hidden>{AVATAR_EMOJI[data.profile.avatar] ?? '⌨️'}</span>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-xl"
            >
              <div className="border-b border-line px-3 py-2.5">
                <p className="truncate text-sm font-bold text-ink">{data.profile.displayName}</p>
                <p className="text-xs text-ink-muted">
                  Level {level.level} · {level.title}
                  {data.profile.mode === 'local' && ' · Guest'}
                </p>
              </div>
              <MenuLink to="/app/profile" icon={<UserRound className="size-4" />} onClick={() => setMenuOpen(false)}>
                Profile
              </MenuLink>
              <MenuLink to="/app/achievements" icon={<Trophy className="size-4" />} onClick={() => setMenuOpen(false)}>
                Achievements
              </MenuLink>
              <MenuLink to="/app/settings" icon={<SettingsIcon className="size-4" />} onClick={() => setMenuOpen(false)}>
                Settings
              </MenuLink>
              <MenuLink to="/app" icon={<LogOut className="size-4" />} onClick={() => setMenuOpen(false)}>
                Back to dashboard
              </MenuLink>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function MenuLink({
  to,
  icon,
  children,
  onClick,
}: {
  to: string
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {icon}
      {children}
    </Link>
  )
}
