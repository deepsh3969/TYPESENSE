import { useMemo } from 'react'
import { Bug, KeyRound, Target } from 'lucide-react'
import { Card, EmptyState, LinkButton, Pill, Tabs } from '@/components/ui'
import { Keyboard } from '@/components/keyboard/Keyboard'
import { useAnalytics } from '@/hooks/useAnalytics'
import { accuracyToPercent, formatAccuracy } from '@/lib/accuracy'
import { cn } from '@/lib/utils'
import type { ErrorCategory } from '@/types/typing'

const CATEGORY_META: Record<ErrorCategory, { label: string; hint: string }> = {
  transposition: { label: 'Transposed keys', hint: 'You typed the right letters in the wrong order (te → et).' },
  missing: { label: 'Skipped characters', hint: 'A character never got pressed.' },
  extra: { label: 'Stray characters', hint: 'Something typed that was not there.' },
  space: { label: 'Spacing slips', hint: 'Space pressed where a word belongs.' },
  capitalization: { label: 'Shift misses', hint: 'Forgot (or applied) Shift for capitals.' },
  punctuation: { label: 'Punctuation slips', hint: 'Commas, periods, brackets and friends.' },
  number: { label: 'Number-row slips', hint: 'Digits and symbols off the top row.' },
  'repeated-word': { label: 'Double words', hint: 'A word typed twice in a row.' },
  'wrong-key': { label: 'Wrong keys', hint: 'A different key than the one on screen.' },
  slow: { label: 'Slow spots', hint: 'Hesitations, not errors — kept out of error counts.' },
}

const STATUS_STYLE: Record<string, string> = {
  critical: 'bg-danger/10 text-danger border-danger/30',
  'needs-practice': 'bg-warning/10 text-warning border-warning/30',
  good: 'bg-success/10 text-success border-success/30',
  strong: 'bg-primary/10 text-primary border-primary/30',
}

function KeyCell({ k }: { k: string }) {
  return (
    <kbd className="inline-flex min-w-8 justify-center rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-sm font-bold uppercase text-ink shadow-sm">
      {k === 'space' ? '␣' : k}
    </kbd>
  )
}

export function Mistakes() {
  const { sessions, summary, patterns, words } = useAnalytics(30)

  const categoryCounts = useMemo(() => {
    const counts = new Map<ErrorCategory, { count: number; corrected: number }>()
    for (const s of sessions) {
      for (const e of s.errors) {
        const prev = counts.get(e.category) ?? { count: 0, corrected: 0 }
        prev.count++
        if (e.corrected) prev.corrected++
        counts.set(e.category, prev)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1].count - a[1].count)
  }, [sessions])

  const totalErrors = categoryCounts.reduce((a, [, v]) => a + v.count, 0)

  const heat = useMemo(() => {
    const map = new Map<string, number>()
    for (const k of summary.problemKeys) map.set(k.key, k.accuracy)
    return map
  }, [summary.problemKeys])

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<Bug className="size-8" />}
        title="No mistakes to show yet"
        description="Take a typing test and every error will be classified here automatically."
        action={<LinkButton to="/app/test">Take your first test</LinkButton>}
      />
    )
  }

  const allPatterns = [...patterns.bigrams, ...patterns.transpositions, ...patterns.substitutions]
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 12)

  const tabs = [
    {
      id: 'keys',
      label: 'Problem keys',
      content: (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            {summary.problemKeys.slice(0, 14).map((k) => (
              <Card key={k.key} className="flex items-center gap-4 p-4">
                <KeyCell k={k.key} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
                    <span>{k.attempts} attempts · {k.errors} errors</span>
                    <span className={cn('rounded-[3px] border px-2 py-0.5 text-[10px] font-bold uppercase', STATUS_STYLE[k.status])}>
                      {k.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden bg-surface-2">
                    <div
                      className={cn('h-full', k.score < 88 ? 'bg-danger' : k.score < 94 ? 'bg-warning' : 'bg-success')}
                      style={{ width: `${Math.max(4, accuracyToPercent(k.accuracy, 0))}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink">{formatAccuracy(k.accuracy)} accuracy</p>
                </div>
              </Card>
            ))}
          </div>
          <div className="flex justify-center">
            <LinkButton to="/app/practice/problem-keys">Drill these keys</LinkButton>
          </div>
        </div>
      ),
    },
    {
      id: 'words',
      label: 'Weak words',
      content: (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {words.filter((w) => w.errors > 0).slice(0, 12).map((w) => (
              <Card key={w.word} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-bold text-ink">{w.word}</span>
                  <Pill className={cn(w.accuracy < 0.9 ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning')}>
                    {formatAccuracy(w.accuracy, 1)}
                  </Pill>
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  {w.errors} breaks in {w.attempts} attempts · avg {Math.round(w.avgTimeMs)}ms
                </p>
              </Card>
            ))}
            {words.filter((w) => w.errors > 0).length === 0 && (
              <p className="text-sm text-ink-muted sm:col-span-2 lg:col-span-3">
                Your word accuracy looks healthy — push your speed to surface new weak spots.
              </p>
            )}
          </div>
          <div className="flex justify-center">
            <LinkButton to="/app/practice/weak-words">Drill weak words</LinkButton>
          </div>
        </div>
      ),
    },
    {
      id: 'patterns',
      label: 'Patterns',
      content: (
        <div className="space-y-3">
          {allPatterns.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <span className="rounded-lg bg-surface-2 px-2 py-1 font-mono text-sm font-bold text-ink">
                {p.expected}
                {p.actual ? ` → ${p.actual}` : ''}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Pill className="bg-primary/10 text-primary">{p.kind}</Pill>
                  <span className="text-xs text-ink-muted">
                    {p.errors}/{p.attempts} broken · {formatAccuracy(p.accuracy, 1)} · {Math.round(p.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-muted">{p.recommendation}</p>
              </div>
            </Card>
          ))}
          {allPatterns.length === 0 && (
            <p className="text-sm text-ink-muted">Not enough repetition yet to detect stable patterns.</p>
          )}
          <div className="flex justify-center">
            <LinkButton to="/app/practice/combinations">Drill combinations</LinkButton>
          </div>
        </div>
      ),
    },
    {
      id: 'categories',
      label: 'Error categories',
      content: (
        <div className="space-y-4">
          {totalErrors === 0 && (
            <p className="text-sm text-ink-muted">A clean window — no errors in the last 30 days.</p>
          )}
          <div className="space-y-3">
            {categoryCounts.map(([cat, v]) => {
              const meta = CATEGORY_META[cat]
              const share = totalErrors ? (v.count / totalErrors) * 100 : 0
              return (
                <Card key={cat} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-ink">{meta.label}</p>
                      <p className="text-xs text-ink-muted">{meta.hint}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-ink">{v.count}</p>
                      <p className="text-[11px] text-ink-faint">{Math.round(share)}% of errors</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden bg-surface-2">
                    <div className="h-full bg-primary" style={{ width: `${Math.max(2, share)}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-faint">
                    {accuracyToPercent(v.corrected / v.count, 0)}% caught and fixed by you
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
        <div>
          <p className="label label-accent mb-2">Diagnostics</p>
          <h1 className="section-title flex items-center gap-3 text-ink">
            <Bug className="size-7 text-danger" aria-hidden />
            Mistake Lab
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Every keystroke classified. {totalErrors} errors analysed in the last 30 days.
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton to="/app/practice" variant="secondary" size="sm">
            <Target className="size-4" /> Practice instead
          </LinkButton>
        </div>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <h2 className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-ink uppercase">
            <KeyRound className="size-4 text-primary" aria-hidden />
            Keyboard heat — accuracy by key
          </h2>
          <span className="flex items-center gap-1.5 text-[11px] text-ink-faint">
            <span className="size-2.5 rounded-sm bg-danger/60" /> weak
            <span className="size-2.5 rounded-sm bg-warning/50" /> shaky
            <span className="size-2.5 rounded-sm bg-surface-2" /> fine
          </span>
        </div>
        <Keyboard heat={heat} size="md" className="w-full" />
      </Card>

      <Tabs items={tabs} defaultValue="keys" />
    </div>
  )
}
