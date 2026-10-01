import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Clock, Flame, Gauge, GraduationCap, Target, Trophy, Zap } from 'lucide-react'
import { Badge, Card, Label, LinkButton, Pill, StatCard } from '@/components/ui'
import { useUserStore } from '@/stores/userStore'
import { useSessionsStore } from '@/stores/sessionsStore'
import { useProgressStore } from '@/stores/progressStore'
import { levelFromXp } from '@/gamification/levels'
import { displayedStreak } from '@/gamification/streaks'
import { ACHIEVEMENT_MAP } from '@/gamification/achievements'
import { isSupabaseConfigured } from '@/lib/supabase'
import { accuracyToPercent } from '@/lib/accuracy'
import { maybeSyncProfile } from '@/services/sync'
import { cn, formatDuration } from '@/lib/utils'

const AVATARS = ['keyboard', 'zap', 'target', 'rocket', 'brain', 'sparkles'] as const
const AVATAR_EMOJI: Record<string, string> = {
  keyboard: '⌨️',
  zap: '⚡',
  target: '🎯',
  rocket: '🚀',
  brain: '🧠',
  sparkles: '✨',
}

export function Profile() {
  const profile = useUserStore((s) => s.data.profile)
  const stats = useUserStore((s) => s.data.stats)
  const streakState = useUserStore((s) => s.data.streak)
  const achievements = useUserStore((s) => s.data.achievements)
  const xpLog = useUserStore((s) => s.data.xpLog)
  const setProfile = useUserStore((s) => s.setProfile)
  const sessionCount = useSessionsStore((s) => s.sessions.length)
  const lessonProgress = useProgressStore((s) => s.lessonProgress)

  const [name, setName] = useState(profile.displayName)
  const level = levelFromXp(profile.xp)
  const lessonsDone = Object.values(lessonProgress).filter((p) => p.status === 'completed').length

  return (
    <div className="space-y-5">
      <div className="border-b border-line pb-5">
        <p className="label label-accent mb-2">Account</p>
        <h1 className="section-title text-ink">Profile</h1>
        <p className="mt-2 text-sm text-ink-muted">Your identity, stats and everything you have earned.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* identity */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-[4px] border border-primary/40 bg-primary/10 text-3xl">
              {AVATAR_EMOJI[profile.avatar] ?? '⌨️'}
            </span>
            <div className="min-w-0">
              <input
                aria-label="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                  setProfile({ displayName: name.trim() || 'Typist' })
                  void maybeSyncProfile()
                }}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-lg font-extrabold text-ink transition-colors hover:border-line focus:border-primary focus:outline-none"
              />
              <p className="px-1 text-xs text-ink-muted">
                Level {level.level} · {level.title}
              </p>
              <div className="mt-1.5 px-1">
                <Badge tone={profile.mode === 'local' ? 'neutral' : 'success'}>
                  {profile.mode === 'local' ? 'Guest (local)' : 'Synced account'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Label>Avatar</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setProfile({ avatar: a })
                    void maybeSyncProfile()
                  }}
                  aria-pressed={profile.avatar === a}
                  className={cn(
                    'flex size-10 items-center justify-center rounded-[4px] border-2 text-xl transition-transform hover:scale-105',
                    profile.avatar === a ? 'border-primary bg-primary/10' : 'border-line bg-surface-2',
                  )}
                >
                  {AVATAR_EMOJI[a]}
                </button>
              ))}
            </div>
          </div>

          {/* XP */}
          <div className="mt-5 rounded-[4px] bg-surface-2/70 p-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-ink">Level {level.level} progress</span>
              <span className="text-ink-muted">
                {level.intoLevel}/{level.bandSize} XP
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden bg-surface">
              <div className="h-full bg-primary transition-[width] duration-700" style={{ width: `${level.progress}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-ink-muted">
              {level.toNext} XP until Level {level.level + 1} — {level.title}
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="mt-4 flex items-center justify-between gap-2 rounded-[4px] border border-line p-3">
              <div>
                <p className="text-xs font-bold text-ink">Sync your progress</p>
                <p className="text-[11px] text-ink-muted">Connect an account to back up across devices.</p>
              </div>
              <LinkButton to="/login" size="sm" variant="outline">
                Sign in
              </LinkButton>
            </div>
          )}
        </Card>

        {/* stats */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Best WPM" value={stats.bestWpm} tone="warning" icon={<Gauge className="size-5" />} />
            <StatCard
              label="Best accuracy"
              value={stats.testsTaken > 0 ? accuracyToPercent(stats.bestAccuracy, 1) : '—'}
              unit={stats.testsTaken > 0 ? '%' : undefined}
              tone="success"
              icon={<Target className="size-5" />}
            />
            <StatCard label="Streak" value={displayedStreak(streakState)} icon={<Flame className="size-5" />} tone="accent" />
            <StatCard label="Tests" value={stats.testsTaken} icon={<Trophy className="size-5" />} />
            <StatCard label="Lessons" value={`${lessonsDone}`} icon={<GraduationCap className="size-5" />} hint={`${stats.lessonsCompleted} completions`} />
            <StatCard label="Practice time" value={formatDuration(stats.totalPracticeSeconds)} icon={<Clock className="size-5" />} hint={`${sessionCount} sessions`} />
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-ink uppercase">
                <Award className="size-4 text-accent" aria-hidden />
                Achievements
              </h2>
              <Link to="/app/achievements" className="text-xs font-semibold text-primary hover:underline">
                View all →
              </Link>
            </div>
            {achievements.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Nothing yet — your first test unlocks &quot;First Take&quot;.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {achievements.slice(0, 8).map((a) => (
                  <Pill key={a.id} className="bg-accent/10 text-accent">
                    <Trophy className="size-3" /> {ACHIEVEMENT_MAP[a.id]?.title ?? a.id}
                  </Pill>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-ink uppercase">
              <Zap className="size-4 text-primary" aria-hidden />
              Recent XP
            </h2>
            {xpLog.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Earn XP by finishing tests, lessons and streaks.</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {xpLog.slice(0, 6).map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">
                      {e.label}
                      <span className="ml-2 text-ink-faint">{new Date(e.at).toLocaleDateString()}</span>
                    </span>
                    <span className="font-bold text-primary">+{e.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
