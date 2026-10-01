import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, Lock, PlayCircle, Trophy } from 'lucide-react'
import { Card, LinkButton, Progress } from '@/components/ui'
import {
  LESSONS,
  LEVELS,
  lessonStatus,
  levelCompletion,
  overallCompletion,
  recommendedLesson,
} from '@/lessons'
import { useProgressStore } from '@/stores/progressStore'
import { cn } from '@/lib/utils'
import type { LessonStatus } from '@/types/lesson'

const CATEGORY_LABEL: Record<string, string> = {
  foundation: 'Foundation',
  reach: 'Reach keys',
  accuracy: 'Accuracy',
  speed: 'Speed',
  mastery: 'Mastery',
}

function StatusIcon({ status }: { status: LessonStatus }) {
  if (status === 'completed') return <CheckCircle2 className="size-4 text-success" aria-hidden />
  if (status === 'locked') return <Lock className="size-4 text-ink-faint" aria-hidden />
  if (status === 'in-progress') return <PlayCircle className="size-4 text-warning" aria-hidden />
  return <PlayCircle className="size-4 text-primary" aria-hidden />
}

export function Lessons() {
  const progress = useProgressStore((s) => s.lessonProgress)
  const rec = recommendedLesson(progress)
  const overall = overallCompletion(progress)
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
        <div>
          <p className="label label-accent mb-2">Curriculum</p>
          <h1 className="section-title text-ink">Lessons</h1>
          <p className="mt-2 text-sm text-ink-muted">{LESSONS.length} lessons across 5 levels — unlock the next by passing the last.</p>
        </div>
        <div className="text-right">
          <p className="label">Completion</p>
          <p className="num text-2xl font-bold text-primary">{Math.round(overall)}%</p>
        </div>
      </div>

      {rec && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/50 bg-primary/5 p-5">
          <div>
            <p className="label label-accent">
              {progress[rec.id]?.attempts ? 'Continue learning' : 'Recommended next'}
            </p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink uppercase">{rec.title}</h2>
            <p className="mt-0.5 text-sm text-ink-muted">{rec.objective}</p>
          </div>
          <LinkButton to={`/app/lessons/${rec.id}`}>
            {progress[rec.id]?.attempts ? 'Keep going' : 'Start lesson'}
          </LinkButton>
        </Card>
      )}

      {LEVELS.map((level) => {
        const completion = levelCompletion(level.level, progress)
        const lessons = LESSONS.filter((l) => l.level === level.level)
        return (
          <section key={level.level} aria-label={`Level ${level.level}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">
                    {level.level}
                  </span>
                  <h2 className="font-display text-base font-bold text-ink uppercase tracking-tight">{level.title}</h2>
                  <span className="text-xs font-medium text-ink-faint">· {level.objective}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink-faint">
                  {completion.completed}/{completion.total}
                </span>
                <Progress value={completion.percent} className="h-1.5 w-28" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson) => {
                const status = lessonStatus(lesson, progress)
                const p = progress[lesson.id]
                const locked = status === 'locked'
                const inner = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          'flex size-9 items-center justify-center rounded-[4px]',
                          status === 'completed'
                            ? 'bg-success/10 text-success'
                            : status === 'locked'
                              ? 'bg-surface-2 text-ink-faint'
                              : 'bg-primary/10 text-primary',
                        )}
                      >
                        <StatusIcon status={status} />
                      </span>
                      <span className="rounded-[3px] border border-line bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        {CATEGORY_LABEL[lesson.category] ?? lesson.category}
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-ink">
                      {lesson.order}. {lesson.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">{lesson.objective}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-ink-faint">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {lesson.estimatedMinutes}m · {lesson.stages.length} stages
                      </span>
                      {p && p.attempts > 0 && (
                        <span className="font-semibold text-ink-muted">best {p.bestWpm} wpm</span>
                      )}
                      {status === 'completed' && <Trophy className="size-3 text-success" aria-hidden />}
                    </div>
                  </>
                )
                return locked ? (
                  <div
                    key={lesson.id}
                    aria-disabled="true"
                    className="card cursor-not-allowed opacity-60"
                    title="Complete the previous lesson first"
                  >
                    {inner}
                  </div>
                ) : (
                  <Link
                    key={lesson.id}
                    to={`/app/lessons/${lesson.id}`}
                    className="card card-hover focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {inner}
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => navigate('/app/progress')}
          className="text-sm font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          See how your lesson accuracy trends over time
        </button>
      </div>
    </div>
  )
}
