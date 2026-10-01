import { useMemo, useState } from 'react'
import { Download, LineChart, Trash2 } from 'lucide-react'
import { Button, Card, Dialog, EmptyState, LinkButton, SegmentedControl, StatCard } from '@/components/ui'
import { MinutesBars, TrendChart } from '@/components/charts'
import { useAnalytics, type RangeDays } from '@/hooks/useAnalytics'
import { dailySeries } from '@/analytics/summarize'
import { useSessionsStore } from '@/stores/sessionsStore'
import { cn, formatDuration } from '@/lib/utils'

const RANGES: { value: RangeDays; label: string }[] = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
  { value: 'all', label: 'All' },
]

export function ProgressPage() {
  const [range, setRange] = useState<RangeDays>(30)
  const [confirmClear, setConfirmClear] = useState(false)
  const { sessions, filtered, summary } = useAnalytics(range)
  const removeSession = useSessionsStore((s) => s.removeSession)
  const clearSessions = useSessionsStore((s) => s.clearSessions)

  const daily = useMemo(() => dailySeries(filtered, range), [filtered, range])
  const tableRows = useMemo(() => {
    const cutoff = range === 'all' ? 0 : Date.now() - range * 86_400_000
    return sessions.filter((s) => new Date(s.startedAt).getTime() >= cutoff)
  }, [sessions, range])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `typesense-sessions-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<LineChart className="size-8" />}
        title="Your progress story starts here"
        description="Complete a test or lesson and this page fills with speed trends, accuracy and history."
        action={<LinkButton to="/app/test">Take a typing test</LinkButton>}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Progress</h1>
          <p className="text-sm text-ink-muted">Measured improvement over {summary.sessions} sessions in view.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            value={String(range)}
            onChange={(v) => setRange(v === 'all' ? 'all' : (Number(v) as RangeDays))}
            options={RANGES.map((r) => ({ value: String(r.value), label: r.label }))}
            ariaLabel="Time range"
            size="sm"
            className="w-auto"
          />
          <Button variant="outline" size="sm" onClick={exportJson}>
            <Download className="size-4" /> Export
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
            <Trash2 className="size-4" /> Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard
          label="Avg WPM"
          value={summary.avgWpm}
          delta={summary.wpmDelta}
          deltaLabel=" vs first half"
          deltaGood={summary.wpmDelta >= 0}
          hint="window delta"
        />
        <StatCard label="Best WPM" value={summary.bestWpm} tone="warning" />
        <StatCard
          label="Accuracy"
          value={summary.avgAccuracy}
          unit="%"
          delta={summary.accuracyDelta}
          deltaLabel=" pts"
          tone="success"
        />
        <StatCard label="Rhythm" value={summary.avgConsistency} unit="%" tone="accent" hint="consistency" />
        <StatCard label="Sessions" value={summary.sessions} hint="in range" />
        <StatCard label="Time" value={formatDuration(summary.totalSeconds)} hint="total practise" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Speed & accuracy trend</h2>
            <span className="text-[11px] text-ink-faint">dotted = accuracy</span>
          </div>
          <TrendChart data={daily} />
        </Card>
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Daily practice</h2>
            <span className="text-[11px] text-ink-faint">minutes per day</span>
          </div>
          <MinutesBars data={daily} />
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-bold text-ink">Session history</h2>
          <span className="text-xs text-ink-faint">newest first</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink-faint">
                <th scope="col" className="px-4 py-2.5 font-semibold">When</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Mode</th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-right">WPM</th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-right">Acc</th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-right">Rhythm</th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-right">Errors</th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-right">Time</th>
                <th scope="col" className="px-4 py-2.5" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(0, 25).map((s) => (
                <tr key={s.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2/60">
                  <td className="whitespace-nowrap px-4 py-2.5 text-ink-muted">
                    {new Date(s.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    <span className="ml-2 text-xs text-ink-faint">
                      {new Date(s.startedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold uppercase', modeStyle(s.source))}>
                      {s.source}
                      {s.practiceMode ? `: ${s.practiceMode}` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-ink">{s.metrics.wpm}</td>
                  <td className="px-4 py-2.5 text-right text-ink-muted">{s.metrics.accuracy}%</td>
                  <td className="px-4 py-2.5 text-right text-ink-muted">{s.metrics.consistency}%</td>
                  <td className="px-4 py-2.5 text-right text-ink-muted">{s.metrics.errors}</td>
                  <td className="px-4 py-2.5 text-right text-ink-muted">
                    {Math.round(s.metrics.elapsedMs / 1000)}s
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => removeSession(s.id)}
                      className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-danger/10 hover:text-danger"
                      aria-label="Delete session"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all session history?"
        description="This removes every stored test and practice session from this browser. Achievements and lesson progress are kept."
      >
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              clearSessions()
              setConfirmClear(false)
            }}
          >
            Clear history
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

function modeStyle(source: string): string {
  if (source === 'test') return 'bg-primary/10 text-primary'
  if (source === 'lesson') return 'bg-accent/10 text-accent'
  return 'bg-success/10 text-success'
}
