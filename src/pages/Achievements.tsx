import { Lock, Trophy } from 'lucide-react'
import { Card, EmptyState, LinkButton, Progress } from '@/components/ui'
import { ACHIEVEMENTS, TIER_LABEL } from '@/gamification/achievements'
import { useUserStore } from '@/stores/userStore'
import { cn } from '@/lib/utils'

const TIER_STYLE: Record<string, string> = {
  bronze: 'bg-warning/10 text-warning border-warning/30',
  silver: 'bg-slate-400/10 text-slate-400 border-slate-400/30',
  gold: 'bg-accent/10 text-accent border-accent/30',
  platinum: 'bg-primary/10 text-primary border-primary/30',
}

export function Achievements() {
  const unlocked = useUserStore((s) => s.data.achievements)
  const unlockedMap = new Map(unlocked.map((a) => [a.id, a]))
  const count = unlockedMap.size

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink">
          <Trophy className="size-6 text-accent" aria-hidden />
          Achievements
        </h1>
        <p className="text-sm text-ink-muted">
          {count} of {ACHIEVEMENTS.length} unlocked — every one earned through real practice.
        </p>
        <Progress value={(count / ACHIEVEMENTS.length) * 100} className="mt-3 max-w-md" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((def) => {
          const got = unlockedMap.get(def.id)
          return (
            <Card
              key={def.id}
              className={cn('relative flex gap-4 p-4', !got && 'opacity-75', got && TIER_STYLE[def.tier])}
            >
              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-xl',
                  got ? 'bg-white/15' : 'bg-surface-2 text-ink-faint',
                )}
              >
                {got ? <Trophy className="size-5" /> : <Lock className="size-4.5" />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={cn('text-sm font-bold', got ? 'text-ink' : 'text-ink-muted')}>{def.title}</h2>
                  <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    {TIER_LABEL[def.tier]}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{def.description}</p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-primary">+{def.xp} XP</span>
                  {got && (
                    <span className="text-ink-faint">
                      {new Date(got.unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {count === 0 && (
        <EmptyState
          title="Nothing unlocked yet"
          description="Take a few tests — your first achievements arrive fast."
          action={<LinkButton to="/app/test">Start a test</LinkButton>}
        />
      )}
    </div>
  )
}
