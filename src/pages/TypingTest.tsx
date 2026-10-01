import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KeyboardIcon, Lightbulb, Plus, RotateCcw, Sliders } from 'lucide-react'
import { Button, Card, LinkButton, SegmentedControl, Textarea } from '@/components/ui'
import { TypingArea } from '@/components/typing/TypingArea'
import { StatsBar } from '@/components/typing/StatsBar'
import { SessionResults } from '@/components/typing/SessionResults'
import { Keyboard } from '@/components/keyboard/Keyboard'
import { useTypingSession } from '@/hooks/useTypingSession'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToasts, ToastStack } from '@/components/ui/Toast'
import { useSessionsStore } from '@/stores/sessionsStore'
import { useUserStore } from '@/stores/userStore'
import { buildTextToLength, buildWordText, charsForDuration } from '@/typing/text'
import { COMMON_WORDS } from '@/data/words'
import { SENTENCES } from '@/data/passages'
import type { TypingSession } from '@/types/typing'
import type { SessionOutcome } from '@/stores/userStore'

type TestMode = 'time' | 'words' | 'custom'

const TIME_OPTIONS = [15, 30, 60, 120]
const WORD_OPTIONS = [10, 25, 50, 100]

export function TypingTest() {
  const [params, setParams] = useSearchParams()
  const mode = (params.get('mode') as TestMode) || 'time'
  const lengthParam = Number(params.get('length'))
  const length =
    mode === 'time'
      ? TIME_OPTIONS.includes(lengthParam)
        ? lengthParam
        : 30
      : WORD_OPTIONS.includes(lengthParam)
        ? lengthParam
        : 25

  const [customText, setCustomText] = useState('')
  const [seed, setSeed] = useState(0)
  const [result, setResult] = useState<{ session: TypingSession; outcome: SessionOutcome } | null>(null)

  const addSession = useSessionsStore((s) => s.addSession)
  const recordSession = useUserStore((s) => s.recordSession)
  const { toasts, push, dismiss } = useToasts()
  const { plan, summary } = useAnalytics(30)

  const setMode = (next: string) => {
    setResult(null)
    setParams({ mode: next, length: String(next === 'time' ? 30 : 25) })
  }
  const setLength = (next: number) => {
    setResult(null)
    setParams({ mode, length: String(next) })
  }

  const text = useMemo(() => {
    if (mode === 'time') return buildTextToLength(SENTENCES, charsForDuration(length))
    if (mode === 'words') return buildWordText(COMMON_WORDS, length)
    return customText.trim() ? customText : ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, length, customText, seed])

  const setup = useMemo(
    () => ({
      text,
      mode,
      source: 'test' as const,
      target: length,
      durationMs: mode === 'time' ? length * 1000 : undefined,
    }),
    [text, mode, length],
  )

  const handleFinish = useCallback(
    (session: TypingSession) => {
      addSession(session)
      const outcome = recordSession(session)
      setResult({ session, outcome })
      push({
        icon: 'xp',
        title: `+${outcome.xp} XP`,
        detail: `${session.metrics.wpm} WPM - ${session.metrics.accuracy}% accuracy`,
      })
      if (outcome.levelUp) push({ icon: 'levelup', title: `Level ${outcome.levelUp.to}!`, detail: 'Keep the momentum going.' })
      if (outcome.streakExtended) push({ icon: 'streak', title: `Streak: ${outcome.streak} days`, detail: 'Practice daily to keep it alive.' })
      for (const id of outcome.unlocked) push({ icon: 'achievement', title: 'Achievement unlocked!', detail: id })
    },
    [addSession, recordSession, push],
  )

  const { slots, status, live, restart, lastKey, text: engineText, index } = useTypingSession(setup, handleFinish)

  const newTest = () => {
    setResult(null)
    setSeed((s) => s + 1)
    restart()
  }

  const retry = () => {
    setResult(null)
    restart()
  }

  const heat = useMemo(() => {
    const map = new Map<string, number>()
    for (const k of summary.problemKeys) map.set(k.key, k.accuracy * 100)
    return map
  }, [summary.problemKeys])

  const wordDone = useMemo(
    () => (engineText ? engineText.slice(0, index).split(' ').filter(Boolean).length : 0),
    [engineText, index],
  )

  const canRun = text.trim().length > 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Typing Test</h1>
          <p className="text-sm text-ink-muted">Measure your speed, then let the analysis do the talking.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={newTest}>
            <Plus className="size-4" /> New test
          </Button>
        </div>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: 'time', label: 'Time' },
            { value: 'words', label: 'Words' },
            { value: 'custom', label: 'Custom' },
          ]}
          ariaLabel="Test mode"
        />
        <div className="h-6 w-px bg-line" aria-hidden />
        {mode !== 'custom' ? (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Length">
            {(mode === 'time' ? TIME_OPTIONS : WORD_OPTIONS).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setLength(opt)}
                disabled={status === 'running'}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors disabled:opacity-50 ${
                  length === opt ? 'bg-primary text-white' : 'bg-surface-2 text-ink-muted hover:text-ink'
                }`}
              >
                {opt}
                {mode === 'time' ? 's' : ' words'}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-sm text-ink-muted">Paste or type your own text below.</span>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-ink-faint">
          <Sliders className="size-3.5" aria-hidden />
          {mode === 'time'
            ? 'Ends when the timer runs out'
            : mode === 'words'
              ? 'Ends at the last word'
              : 'Ends at the last character'}
        </div>
      </Card>

      {mode === 'custom' && (
        <Card className="p-4">
          <label htmlFor="custom-text" className="mb-2 block text-sm font-bold text-ink">
            Custom text
          </label>
          <Textarea
            id="custom-text"
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value)
              setResult(null)
            }}
            rows={4}
            placeholder="Paste any text you want to practise..."
            className="font-mono"
          />
          {!canRun && <p className="mt-2 text-xs text-ink-faint">Add at least a few words to start the test.</p>}
        </Card>
      )}

      {result ? (
        <SessionResults
          session={result.session}
          outcome={result.outcome}
          plan={plan}
          title="Test complete"
          onRestart={retry}
          restartLabel="Same test again"
          onPlanAction={(action) => {
            if (action === 'retest') retry()
          }}
          extraActions={
            <Button variant="secondary" size="lg" onClick={newTest}>
              <Plus className="size-4" /> New test
            </Button>
          }
        />
      ) : (
        <>
          <StatsBar live={live} progressLabel={mode === 'words' ? `${wordDone} / ${length} words` : undefined} />
          {canRun ? (
            <TypingArea slots={slots} index={index} text={engineText} running={status === 'running'} />
          ) : (
            <Card className="p-8 text-center text-sm text-ink-muted">
              Your custom text will appear here once you add it above.
            </Card>
          )}

          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                <KeyboardIcon className="size-4 text-primary" aria-hidden />
                Keyboard
                {status === 'running' && (
                  <button
                    type="button"
                    onClick={retry}
                    className="ml-2 inline-flex items-center gap-1 rounded-lg bg-surface-2 px-2 py-1 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
                  >
                    <RotateCcw className="size-3" /> Restart
                  </button>
                )}
              </h2>
              <span className="flex items-center gap-1.5 text-xs text-ink-faint">
                <Lightbulb className="size-3.5" aria-hidden />
                Red keys are your weakest - every mistake is classified automatically.
              </span>
            </div>
            <Keyboard lastKey={lastKey} heat={heat} size="md" className="w-full" />
            <div className="mt-3 flex justify-center">
              <LinkButton to="/app/practice/problem-keys" variant="outline" size="sm">
                Drill your problem keys
              </LinkButton>
            </div>
          </Card>
        </>
      )}

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
