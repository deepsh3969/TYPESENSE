import { useState } from 'react'
import { Database, Info, Moon, ShieldCheck, Sun, Trash2, UserRound } from 'lucide-react'
import { Button, Card, Dialog, Field, Input, LinkButton, SegmentedControl, Select, Switch } from '@/components/ui'
import { useUserStore } from '@/stores/userStore'
import { useSessionsStore } from '@/stores/sessionsStore'
import { useProgressStore } from '@/stores/progressStore'
import { useUiStore, type ThemeMode } from '@/stores/uiStore'
import { useTheme } from '@/hooks/useTheme'
import { isSupabaseConfigured } from '@/lib/supabase'
import { maybeSyncProfile } from '@/services/sync'

export function Settings() {
  const profile = useUserStore((s) => s.data.profile)
  const setProfile = useUserStore((s) => s.setProfile)
  const resetProgress = useUserStore((s) => s.resetProgress)
  const clearSessions = useSessionsStore((s) => s.clearSessions)
  const resetLessons = useProgressStore((s) => s.reset)
  const theme = useUiStore((s) => s.theme)
  const { setTheme } = useTheme()

  const [goal, setGoal] = useState(String(profile.dailyGoalMinutes))
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const saveGoal = (value: string) => {
    const n = Math.max(1, Math.min(240, Number(value) || 15))
    setGoal(String(n))
    setProfile({ dailyGoalMinutes: n })
    void maybeSyncProfile()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Settings</h1>
        <p className="text-sm text-ink-muted">Appearance, goals and your data.</p>
      </div>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          {theme === 'dark' ? <Moon className="size-4 text-primary" /> : <Sun className="size-4 text-warning" />}
          Appearance
        </h2>
        <div className="mt-3 max-w-xs">
          <SegmentedControl
            value={theme}
            onChange={(v) => setTheme(v as ThemeMode)}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
            ariaLabel="Theme"
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          <UserRound className="size-4 text-primary" />
          Practice preferences
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Daily goal (minutes)" htmlFor="goal-input">
            <Input
              id="goal-input"
              type="number"
              min={1}
              max={240}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onBlur={(e) => saveGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveGoal(goal)}
            />
          </Field>
          <Field label="Preferred difficulty" htmlFor="difficulty-select">
            <Select
              id="difficulty-select"
              value={String(profile.preferredDifficulty)}
              onChange={(e) => {
                setProfile({ preferredDifficulty: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })
                void maybeSyncProfile()
              }}
            >
              <option value="1">1 — Gentle</option>
              <option value="2">2 — Easy</option>
              <option value="3">3 — Standard</option>
              <option value="4">4 — Hard</option>
              <option value="5">5 — Ruthless</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 rounded-xl border border-line p-3">
          <Switch
            checked
            onChange={() => undefined}
            disabled
            label="Reduced motion"
            description="Follows your system preference automatically."
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          <ShieldCheck className="size-4 text-success" />
          Data & privacy
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          TypeSense stores everything in your browser&apos;s local storage. Nothing leaves your device
          unless you connect a Supabase account.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-ink-muted">
            <Database className="size-3.5" /> Supabase:{' '}
            <span className={isSupabaseConfigured ? 'text-success' : 'text-ink-faint'}>
              {isSupabaseConfigured ? 'configured' : 'not configured (local mode)'}
            </span>
          </span>
          {!isSupabaseConfigured && (
            <LinkButton to="/login" size="sm" variant="outline">
              Learn about accounts
            </LinkButton>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setConfirmClear(true)}>
            <Trash2 className="size-4" /> Clear session history
          </Button>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            Reset all progress
          </Button>
        </div>
      </Card>

      <Card className="flex flex-wrap items-start gap-3 p-5">
        <Info className="mt-0.5 size-4 text-ink-faint" aria-hidden />
        <div className="text-xs leading-relaxed text-ink-muted">
          <p className="font-bold text-ink">How metrics are calculated</p>
          <p className="mt-1">
            WPM = (correct characters ÷ 5) ÷ minutes. Accuracy = correct keystrokes ÷ all keystrokes.
            Rhythm = 1 − (stdev of key delays ÷ mean), scaled to 0–100. Full formulas live in{' '}
            <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11px]">src/typing/metrics.ts</code>.
          </p>
          <p className="mt-2">
            Version 1.0.0 · <LinkButton to="/" size="sm" variant="ghost" className="h-auto p-0 text-primary">Back to landing</LinkButton>
          </p>
        </div>
      </Card>

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear session history?"
        description="Removes all stored sessions from this browser. Lessons, achievements and XP are kept."
      >
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>Cancel</Button>
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

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset everything?"
        description="Wipes XP, achievements, streaks, lesson progress and session history. This cannot be undone."
      >
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              resetProgress()
              clearSessions()
              resetLessons()
              setConfirmReset(false)
            }}
          >
            Reset everything
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
