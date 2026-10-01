import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ChevronRight, Keyboard as KeyboardIcon, Lightbulb, RotateCcw, Target, Trophy, XCircle } from 'lucide-react'
import { Button, Card, EmptyState, LinkButton, Pill } from '@/components/ui'
import { TypingArea } from '@/components/typing/TypingArea'
import { StatsBar } from '@/components/typing/StatsBar'
import { Keyboard } from '@/components/keyboard/Keyboard'
import { useTypingSession } from '@/hooks/useTypingSession'
import { useToasts, ToastStack } from '@/components/ui/Toast'
import { useSessionsStore } from '@/stores/sessionsStore'
import { useUserStore, type SessionOutcome } from '@/stores/userStore'
import { useProgressStore } from '@/stores/progressStore'
import { currentUserId, maybeSyncLessonProgress, maybeSyncSession } from '@/services/sync'
import { evaluateStage, getLesson, LESSONS, lessonStatus, type StageOutcome } from '@/lessons'
import { accuracyToPercent, formatAccuracy } from '@/lib/accuracy'
import type { LessonResult } from '@/types/lesson'
import type { TypingSession } from '@/types/typing'
import { cn } from '@/lib/utils'

interface AttemptRecord {
  accuracy: number
  errors: number
  wpm: number
}

export function LessonDetail() {
  const { id } = useParams()
  const lesson = id ? getLesson(id) : undefined

  const progressMap = useProgressStore((s) => s.lessonProgress)
  const upsertLessonProgress = useProgressStore((s) => s.upsertLessonProgress)
  const addSession = useSessionsStore((s) => s.addSession)
  const recordSession = useUserStore((s) => s.recordSession)
  const recordLesson = useUserStore((s) => s.recordLesson)
  const { toasts, push, dismiss } = useToasts()

  const [stageIndex, setStageIndex] = useState(0)
  const [stageOutcome, setStageOutcome] = useState<StageOutcome | null>(null)
  const [stageSession, setStageSession] = useState<TypingSession | null>(null)
  const [lessonDone, setLessonDone] = useState<{ result: LessonResult; outcome: SessionOutcome } | null>(null)
  const [attempts, setAttempts] = useState<AttemptRecord[]>([])

  const stage = lesson?.stages[stageIndex]

  const setup = useMemo(
    () => ({
      text: stage?.text ?? '',
      mode: 'lesson' as const,
      source: 'lesson' as const,
      target: stageIndex + 1,
      lessonId: lesson?.id ?? null,
    }),
    [stage?.text, stageIndex, lesson?.id],
  )

  const handleFinish = useCallback(
    (session: TypingSession) => {
      if (!lesson) return
      const uid = currentUserId()
      if (uid) session.userId = uid
      addSession(session)
      void maybeSyncSession(session)
      const sessionOutcome = recordSession(session)

      const outcome = evaluateStage(lesson, stageIndex, session.metrics.accuracy, session.metrics.wpm)
      const first = attempts[0]
      const record: AttemptRecord = {
        accuracy: session.metrics.accuracy,
        errors: session.metrics.errors,
        wpm: session.metrics.wpm,
      }
      const nextAttempts = [...attempts, record]
      setAttempts(nextAttempts)

      const prev = progressMap[lesson.id]
      const isFinal = stageIndex === lesson.stages.length - 1
      const now = new Date().toISOString()

      if (outcome.passed && isFinal) {
        const result: LessonResult = {
          lessonId: lesson.id,
          accuracy: session.metrics.accuracy,
          wpm: session.metrics.wpm,
          errorsReduced: Math.max(0, (first?.errors ?? session.metrics.errors) - session.metrics.errors),
          improvement: first ? accuracyToPercent(session.metrics.accuracy - first.accuracy, 1) : 0,
          passed: true,
        }
        const row = {
          lessonId: lesson.id,
          status: 'completed' as const,
          attempts: (prev?.attempts ?? 0) + 1,
          bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, session.metrics.accuracy),
          bestWpm: Math.max(prev?.bestWpm ?? 0, session.metrics.wpm),
          completedAt: now,
        }
        upsertLessonProgress(row)
        void maybeSyncLessonProgress(row)
        const lessonOutcome = recordLesson(result)
        setLessonDone({ result, outcome: lessonOutcome })
        push({ icon: 'xp', title: `Lesson complete! +${lessonOutcome.xp} XP`, detail: lesson.title })
        for (const aid of lessonOutcome.unlocked) push({ icon: 'achievement', title: 'Achievement unlocked!', detail: aid })
      } else {
        const row = {
          lessonId: lesson.id,
          status: 'in-progress' as const,
          attempts: (prev?.attempts ?? 0) + 1,
          bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, session.metrics.accuracy),
          bestWpm: Math.max(prev?.bestWpm ?? 0, session.metrics.wpm),
          completedAt: prev?.completedAt ?? null,
        }
        upsertLessonProgress(row)
        void maybeSyncLessonProgress(row)
        setStageOutcome(outcome)
      }

      setStageSession(session)
      if (sessionOutcome.levelUp) push({ icon: 'levelup', title: `Level ${sessionOutcome.levelUp.to}!`, detail: 'XP from your lesson run.' })
    },
    [lesson, stageIndex, attempts, progressMap, addSession, recordSession, recordLesson, upsertLessonProgress, push],
  )

  const { slots, status, live, restart, lastKey, text: engineText, index } = useTypingSession(setup, handleFinish)

  if (!lesson || !stage) {
    return (
      <EmptyState
        title="Lesson not found"
        description="It may have been removed."
        action={<LinkButton to="/app/lessons">Back to lessons</LinkButton>}
      />
    )
  }

  const status_ = lessonStatus(lesson, progressMap)
  if (status_ === 'locked') {
    return (
      <EmptyState
        icon={<Trophy className="size-8" />}
        title="Lesson locked"
        description="Complete the previous lesson to unlock this one."
        action={<LinkButton to="/app/lessons">Back to lessons</LinkButton>}
      />
    )
  }

  const nextLesson = LESSONS[LESSONS.findIndex((l) => l.id === lesson.id) + 1] ?? null

  // ---------- lesson complete ----------
  if (lessonDone) {
    return (
      <div className="space-y-5">
        <Card className="border-success/40 p-6 text-center sm:p-10">
          <span className="mx-auto flex size-14 items-center justify-center rounded-[4px] bg-success/10">
            <Trophy className="size-7 text-success" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink uppercase">{lesson.title} — completed!</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {formatAccuracy(lessonDone.result.accuracy, 1)} accuracy · {lessonDone.result.wpm} WPM
            {lessonDone.result.improvement > 0 && ` · +${lessonDone.result.improvement} pp accuracy across attempts`}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Pill className="bg-primary/10 text-primary">+{lessonDone.outcome.xp} XP</Pill>
            <Pill className="bg-accent/10 text-accent">{lessonDone.outcome.unlocked.length} achievements</Pill>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {nextLesson && lessonStatus(nextLesson, progressMap) !== 'locked' && (
              <LinkButton to={`/app/lessons/${nextLesson.id}`}>
                Next lesson: {nextLesson.title} <ChevronRight className="size-4" />
              </LinkButton>
            )}
            <LinkButton to="/app/lessons" variant="secondary">
              Back to lessons
            </LinkButton>
          </div>
        </Card>
        <ToastStack toasts={toasts} onDismiss={dismiss} />
      </div>
    )
  }

  // ---------- stage result ----------
  if (stageOutcome && stageSession) {
    const passed = stageOutcome.passed
    const isFinal = stageIndex === lesson.stages.length - 1
    return (
      <div className="space-y-5">
        <Card className={cn('p-6', passed ? 'border-success/40' : 'border-warning/50')}>
          <div className="flex items-center gap-3">
            <span className={cn('flex size-11 items-center justify-center rounded-[4px]', passed ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
              {passed ? <CheckCircle2 className="size-6" /> : <XCircle className="size-6" />}
            </span>
            <div>
              <h1 className="text-lg font-display font-bold text-ink uppercase">
                {passed ? 'Stage passed!' : 'Not quite — run it again'}
              </h1>
              <p className="text-sm text-ink-muted">
                Stage {stageIndex + 1} of {lesson.stages.length} · {stage.label}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ResultStat
              label="Accuracy"
              value={formatAccuracy(stageSession.metrics.accuracy, 1)}
              goal={`${stageOutcome.goalAccuracy}% needed`}
              good={accuracyToPercent(stageSession.metrics.accuracy, 2) >= stageOutcome.goalAccuracy}
            />
            <ResultStat label="Speed" value={`${stageSession.metrics.wpm} WPM`} goal={stageOutcome.goalWpm ? `${stageOutcome.goalWpm} needed` : 'no speed goal'} good={stageOutcome.goalWpm === null || stageSession.metrics.wpm >= stageOutcome.goalWpm} />
            <ResultStat label="Errors" value={String(stageSession.metrics.errors)} goal={`${stageSession.metrics.corrections} fixed`} />
            <ResultStat label="Rhythm" value={`${stageSession.metrics.consistency}%`} goal="consistency" good={stageSession.metrics.consistency >= 70} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {passed && !isFinal ? (
              <Button
                size="lg"
                onClick={() => {
                  setStageOutcome(null)
                  setStageSession(null)
                  setStageIndex((i) => i + 1)
                }}
              >
                Next stage <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => {
                  setStageOutcome(null)
                  setStageSession(null)
                  setAttempts([])
                  restart()
                }}
              >
                <RotateCcw className="size-4" /> {passed ? 'Replay stage' : 'Retry stage'}
              </Button>
            )}
            <LinkButton to="/app/lessons" variant="ghost" size="lg">
              Leave lesson
            </LinkButton>
          </div>
        </Card>
        <ToastStack toasts={toasts} onDismiss={dismiss} />
      </div>
    )
  }

  // ---------- runner ----------
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/app/lessons"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" /> Lessons
          </Link>
          <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-ink uppercase">
            {lesson.order}. {lesson.title}
          </h1>
          <p className="text-sm text-ink-muted">{lesson.objective}</p>
        </div>
        {/* stage stepper */}
        <ol className="flex items-center gap-1.5" aria-label="Stages">
          {lesson.stages.map((s, i) => (
            <li
              key={s.label}
              className={cn(
                'rounded-[3px] border border-line px-2.5 py-1 text-[11px] font-bold',
                i === stageIndex
                  ? 'bg-primary text-white'
                  : i < stageIndex
                    ? 'bg-success/15 text-success'
                    : 'bg-surface-2 text-ink-faint',
              )}
              title={s.label}
            >
              {i + 1}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Pill className="bg-surface-2 text-ink-muted">{stage.kind}</Pill>
        <Pill className="bg-surface-2 text-ink-muted">
          <Target className="size-3" /> {stage.goalAccuracy}% accuracy goal
        </Pill>
        <span className="text-xs text-ink-faint">Stage {stageIndex + 1}: {stage.label}</span>
      </div>

      <StatsBar live={live} />
      <TypingArea slots={slots} index={index} text={engineText} running={status === 'running'} />

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-ink uppercase">
            <KeyboardIcon className="size-4 text-primary" aria-hidden />
            Focus keys: {lesson.keys.slice(0, 8).join(' ')}
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Lightbulb className="size-3.5" aria-hidden />
            Hit the accuracy goal to unlock the next stage
          </span>
        </div>
        <Keyboard lastKey={lastKey} highlight={lesson.keys} size="md" className="w-full" />
      </Card>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

function ResultStat({ label, value, goal, good }: { label: string; value: string; goal: string; good?: boolean }) {
  return (
    <div className={cn('rounded-[4px] border p-3 text-center', good === true ? 'border-success/40 bg-success/5' : good === false ? 'border-warning/50 bg-warning/5' : 'border-line bg-surface-2/50')}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] text-ink-faint">{goal}</p>
    </div>
  )
}
