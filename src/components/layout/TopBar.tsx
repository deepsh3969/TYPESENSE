import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Flame, KeyboardIcon, Moon, Sun, UserRound, LogOut, Settings as SettingsIcon, Trophy, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { LinkButton } from '@/components/ui'
import { displayedStreak, goalProgress } from '@/gamification/streaks'
import { levelFromXp } from '@/gamification/levels'
import { ProgressRing } from '@/components/ui'
import { titleFor } from '@/lib/pageTitles'

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
  const location = useLocation()
  const data = useUserStore((s) => s.data)
  const streak = displayedStreak(data.streak)
  const goal = goalProgress(data.dailyGoal)
  const level = levelFromXp(data.profile.xp)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const authUser = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

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
  const pageTitle = titleFor(location.pathname)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur-md sm:px-6 xl:px-10">
      {/* left: mobile logo / desktop page title */}
      <Link to="/" className="flex items-center gap-2 lg:hidden" aria-label="TypeSense home">
        <span className="flex size-8 items-center justify-center bg-primary text-white">
          <KeyboardIcon className="size-4" aria-hidden />
        </span>
        <span className="font-display text-sm font-bold tracking-tight">
          TYPE<span className="text-primary">SENSE</span>
        </span>
      </Link>
      <div className="hidden min-w-0 lg:block">
        <p className="truncate font-display text-sm font-bold tracking-[0.02em] uppercase">{pageTitle}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* streak */}
        <div
          className="flex items-center gap-1.5 border border-line bg-surface-2 px-2.5 py-1.5 text-sm font-bold"
          title={`${streak}-day streak`}
        >
          <Flame className={cn('size-4', streak > 0 ? 'text-warning' : 'text-ink-faint')} aria-hidden />
          <span className={cn('num', streak > 0 ? 'text-ink' : 'text-ink-faint')}>{streak}</span>
          <span className="sr-only">day streak</span>
        </div>

        {/* daily goal */}
        <Link
          to="/app/progress"
          className="hidden items-center gap-2 border border-line bg-surface-2 py-1 pr-3 pl-1 transition-colors hover:border-primary sm:flex"
          title={`${Math.round(data.dailyGoal.minutes)} / ${data.dailyGoal.goalMinutes} min today`}
        >
          <ProgressRing value={goal} size={30} stroke={3.5}>
            <span className="num text-[9px] font-bold text-ink">{Math.round(goal)}</span>
          </ProgressRing>
          <span className="num text-xs font-bold text-ink-muted">
            {Math.round(data.dailyGoal.minutes)}/{data.dailyGoal.goalMinutes}m
          </span>
        </Link>

        {/* account */}
        {authUser ? (
          <div className="hidden items-center gap-1.5 sm:flex">
            <span
              className="max-w-44 truncate border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-muted"
              title={authUser.email}
            >
              {authUser.email}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex size-9 items-center justify-center border border-line bg-surface-2 text-ink-muted transition-colors hover:border-danger hover:text-danger"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <LinkButton to="/login" size="sm" variant="secondary" className="hidden sm:inline-flex">
            Sign in
          </LinkButton>
        )}

        {/* theme */}
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="flex size-9 items-center justify-center border border-line bg-surface-2 text-ink-muted transition-colors hover:text-ink"
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
            className="flex size-9 items-center justify-center border border-line bg-surface-2 text-lg transition-colors hover:border-primary"
            aria-label="Open profile menu"
          >
            <span aria-hidden>{AVATAR_EMOJI[data.profile.avatar] ?? '⌨️'}</span>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-11 z-50 w-56 overflow-hidden border border-line bg-surface p-1.5 shadow-2xl"
            >
              <div className="border-b border-line px-3 py-2.5">
                <p className="truncate text-sm font-bold text-ink">{data.profile.displayName}</p>
                <p className="text-xs text-ink-muted">
                  Level {level.level} · {level.title}
                  {!authUser && ' · Guest'}
                </p>
              </div>
              {authUser ? (
                <MenuLink to="/app/profile" icon={<UserRound className="size-4" />} onClick={() => setMenuOpen(false)}>
                  Profile
                </MenuLink>
              ) : (
                <MenuLink to="/login" icon={<LogIn className="size-4" />} onClick={() => setMenuOpen(false)}>
                  Sign in
                </MenuLink>
              )}
              <MenuLink to="/app/achievements" icon={<Trophy className="size-4" />} onClick={() => setMenuOpen(false)}>
                Achievements
              </MenuLink>
              <MenuLink to="/app/settings" icon={<SettingsIcon className="size-4" />} onClick={() => setMenuOpen(false)}>
                Settings
              </MenuLink>
              <MenuLink to="/app" icon={<KeyboardIcon className="size-4" />} onClick={() => setMenuOpen(false)}>
                Dashboard
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
      className="flex items-center gap-2.5 rounded-[2px] px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {icon}
      {children}
    </Link>
  )
}
