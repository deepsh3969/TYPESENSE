import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Crosshair,
  FileText,
  GitCompareArrows,
  Hash,
  Keyboard as KeyboardIcon,
  Lightbulb,
  Pilcrow,
  RotateCcw,
  SpellCheck,
  Target,
  Waves,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Button, Card, EmptyState, LinkButton, Textarea } from '@/components/ui'
import { TypingArea } from '@/components/typing/TypingArea'
import { StatsBar } from '@/components/typing/StatsBar'
import { SessionResults } from '@/components/typing/SessionResults'
import { Keyboard } from '@/components/keyboard/Keyboard'
import { useTypingSession } from '@/hooks/useTypingSession'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToasts, ToastStack } from '@/components/ui/Toast'
import { useSessionsStore } from '@/stores/sessionsStore'
import { useUserStore } from '@/stores/userStore'
import { currentUserId, maybeSyncSession } from '@/services/sync'
import { PRACTICE_MODES, PRACTICE_MODE_MAP, TIMED_PRACTICE } from '@/data/practiceModes'
import { generatePracticeText, practiceFocusLabel } from '@/lessons/generators'
import type { PracticeModeId } from '@/types/profile'
import type { TypingSession } from '@/types/typing'
import type { SessionOutcome } from '@/stores/userStore'
import { cn } from '@/lib/utils'

const MODE_ICONS: Record<string, LucideIcon> = {
  keyboard: KeyboardIcon,
  merge: GitCompareArrows,
  'spell-check': SpellCheck,
  zap: Zap,
  target: Target,
  crosshair: Crosshair,
  waves: Waves,
  pilcrow: Pilcrow,
  hash: Hash,
  'file-text': FileText,
}

const ACCENT_RING: Record<string, string> = {
  indigo: 'bg-primary/10 text-primary',
  cyan: 'bg-accent/10 text-accent',
  green: 'bg-success/10 text-success',
  amber: 'bg-warning/10 text-warning',
  rose: 'bg-danger/10 text-danger',
}

export function PracticeIndex() {
  const { plan } = useAnalytics(30)
  const sessionsCount = useSessionsStore((s) => s.sessions.length)
  const focus = plan?.focus.find((f) => f.action.startsWith('practice')) ?? plan?.focus[0] ?? null

  const focusLink =
    focus?.action === 'practice-key'
      ? '/app/practice/problem-keys'
      : focus?.action === 'practice-words'
        ? '/app/practice/weak-words'
        : focus?.action === 'practice-pattern'
          ? '/app/practice/combinations'
          : focus?.action === 'practice-punctuation'
            ? '/app/practice/punctuation'
            : '/app/test'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
        <div>
          <p className="label label-accent mb-2">Drills</p>
          <h1 className="section-title text-ink">Practice</h1>
          <p className="mt-2 text-sm text-ink-muted">Targeted drills generated from your own mistakes.</p>
        </div>
      </div>

      {focus && sessionsCount > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/50 bg-primary/5 p-5">
          <div>
            <p className="label label-accent">Recommended now</p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink uppercase">{plan?.headline}</h2>
            <p className="mt-0.5 text-sm text-ink-muted">{focus.detail}</p>
          </div>
          <LinkButton to={focusLink}>Start recommended drill</LinkButton>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRACTICE_MODES.map((mode) => {
          const Icon = MODE_ICONS[mode.icon] ?? Target
          return (
            <Link
              key={mode.id}
              to={`/app/practice/${mode.id}`}
              className="card card-hover group flex flex-col p-5 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <span
                className={cn(
                  'mb-4 inline-flex w-fit rounded-[4px] p-2.5',
                  ACCENT_RING[mode.accent] ?? ACCENT_RING.indigo,
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="text-base font-bold text-ink group-hover:text-primary">{mode.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{mode.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function PracticeDetail() {
  const { mode: modeParam } = useParams()
  const navigate = useNavigate()
  const modeDef = modeParam ? PRACTICE_MODE_MAP[modeParam] : undefined

  const [drillText, setDrillText] = useState<string | null>(null)
  const [custom, setCustom] = useState('')
  const [result, setResult] = useState<{ session: TypingSession; outcome: SessionOutcome } | null>(null)

  const addSession = useSessionsStore((s) => s.addSession)
  const recordSession = useUserStore((s) => s.recordSession)
  const { toasts, push, dismiss } = useToasts()
  const { plan, practiceContext } = useAnalytics(30)

  const modeId = (modeParam ?? 'custom') as PracticeModeId
  const timedSeconds = TIMED_PRACTICE[modeParam ?? '']
  const focusLabel = useMemo(() => practiceFocusLabel(modeId, practiceContext), [modeId, practiceContext])

  const startDrill = () => {
    if (modeId === 'custom') {
      if (!custom.trim()) return
      setDrillText(custom)
    } else {
      setDrillText(generatePracticeText(modeId, practiceContext))
    }
    setResult(null)
  }

  const another = () => {
    setDrillText(modeId === 'custom' ? custom : generatePracticeText(modeId, practiceContext))
    setResult(null)
  }

  const setup = useMemo(
    () => ({
      text: drillText ?? '',
      mode: 'practice' as const,
      source: 'practice' as const,
      target: timedSeconds ?? (drillText ? drillText.split(' ').length : 0),
      durationMs: timedSeconds ? timedSeconds * 1000 : undefined,
      practiceMode: modeId,
    }),
    [drillText, modeId, timedSeconds],
  )

  const handleFinish = useCallback(
    (session: TypingSession) => {
      const uid = currentUserId()
      if (uid) session.userId = uid
      addSession(session)
      void maybeSyncSession(session)
      const outcome = recordSession(session)
      setResult({ session, outcome })
      push({ icon: 'xp', title: `+${outcome.xp} XP`, detail: `${session.metrics.accuracy}% accuracy drill` })
      for (const id of outcome.unlocked) push({ icon: 'achievement', title: 'Achievement unlocked!', detail: id })
    },
    [addSession, recordSession, push],
  )

  const { slots, status, live, restart, lastKey, text: engineText, index } = useTypingSession(setup, handleFinish)

  const heat = useMemo(() => {
    const map = new Map<string, number>()
    for (const k of plan?.problemKeys ?? []) map.set(k.key, k.accuracy * 100)
    return map
  }, [plan])

  const highlight = useMemo(() => {
    if (modeId === 'problem-keys') return (plan?.problemKeys ?? []).slice(0, 8).map((k) => (k.key === 'space' ? 'space' : k.key))
    if (modeId === 'combinations') {
      const pattern = plan?.biggestPattern
      if (!pattern) return []
      return [...new Set(`${pattern.expected}${pattern.actual}`.toLowerCase().split(''))]
    }
    return []
  }, [modeId, plan])

  if (!modeDef) {
    return (
      <EmptyState
        title="Unknown practice mode"
        description="That drill does not exist."
        action={<LinkButton to="/app/practice">Back to practice modes</LinkButton>}
      />
    )
  }
  const Icon = MODE_ICONS[modeDef.icon] ?? Target

  // ---------- setup screen ----------
  if (!drillText && !result) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate('/app/practice')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" /> All practice modes
        </button>
        <Card className="p-6 sm:p-8">
          <span className={cn('inline-flex rounded-[4px] p-2.5', ACCENT_RING[modeDef.accent] ?? ACCENT_RING.indigo)}>
            <Icon className="size-5" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink uppercase">{modeDef.title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">{modeDef.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-semibold text-ink-muted">
              {focusLabel}
            </span>
            {timedSeconds && (
              <span className="rounded-lg bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                {timedSeconds}s timed run
              </span>
            )}
          </div>

          {modeId === 'custom' && (
            <div className="mt-6">
              <label htmlFor="drill-custom" className="mb-2 block text-sm font-bold text-ink">
                Your text
              </label>
              <Textarea
                id="drill-custom"
                rows={5}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Paste anything and drill it..."
                className="font-mono"
              />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={startDrill} disabled={modeId === 'custom' && !custom.trim()}>
              <Zap className="size-4" /> Start drill
            </Button>
            <LinkButton to="/app/test" size="lg" variant="secondary">
              Take a full test instead
            </LinkButton>
          </div>
        </Card>
      </div>
    )
  }

  // ---------- results ----------
  if (result) {
    return (
      <div className="space-y-5">
        <SessionResults
          session={result.session}
          outcome={result.outcome}
          plan={plan}
          title={`${modeDef.title} complete`}
          onRestart={() => {
            setResult(null)
            restart()
          }}
          restartLabel="Same drill again"
          extraActions={
            <>
              <Button variant="secondary" size="lg" onClick={another}>
                <RotateCcw className="size-4" /> Another drill
              </Button>
              <Button variant="ghost" size="lg" onClick={() => navigate('/app/practice')}>
                All modes
              </Button>
            </>
          }
        />
        <ToastStack toasts={toasts} onDismiss={dismiss} />
      </div>
    )
  }

  // ---------- runner ----------
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate('/app/practice')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" /> All practice modes
          </button>
          <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-ink uppercase">{modeDef.title}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={another}>
          <RotateCcw className="size-4" /> New drill
        </Button>
      </div>

      <StatsBar live={live} />
      <TypingArea slots={slots} index={index} text={engineText} running={status === 'running'} />

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-ink uppercase">
            <KeyboardIcon className="size-4 text-primary" aria-hidden />
            {highlight.length > 0 ? 'Focus keys highlighted' : 'Keyboard'}
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Lightbulb className="size-3.5" aria-hidden />
            {focusLabel}
          </span>
        </div>
        <Keyboard lastKey={lastKey} heat={heat} highlight={highlight} size="md" className="w-full" />
      </Card>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
