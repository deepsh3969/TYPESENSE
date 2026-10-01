import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useSessionsStore } from '@/stores/sessionsStore'
import { useProgressStore } from '@/stores/progressStore'
import { useUserStore } from '@/stores/userStore'
import type { LessonProgress } from '@/types/lesson'
import type { TypingSession } from '@/types/typing'

/** The Supabase user id for the signed-in user, or null in local mode. */
export function currentUserId(): string | null {
  if (!isSupabaseConfigured) return null
  return useAuthStore.getState().user?.id ?? null
}

function logFailure(what: string, message: string) {
  // sync failures never block local play — they are surfaced in the console
  console.warn(`[typesense] ${what} sync failed: ${message}`)
}

/** Fire-and-forget upload of a finished session. No-op unless signed in. */
export async function maybeSyncSession(session: TypingSession): Promise<void> {
  const sb = await getSupabase()
  const uid = currentUserId()
  if (!sb || !uid) return
  const { error } = await sb.from('sessions').upsert({
    id: session.id,
    user_id: uid,
    mode: session.mode,
    source: session.source,
    practice_mode: session.practiceMode ?? null,
    lesson_id: session.lessonId ?? null,
    target: session.target,
    text: session.text,
    started_at: session.startedAt,
    finished_at: session.finishedAt,
    metrics: session.metrics,
    key_stats: session.keyStats,
    errors: session.errors,
    timeline: session.timeline,
  })
  if (error) logFailure('session', error.message)
}

/** Uploads the local profile after a change. No-op unless signed in. */
export async function maybeSyncProfile(): Promise<void> {
  const sb = await getSupabase()
  const uid = currentUserId()
  if (!sb || !uid) return
  const p = useUserStore.getState().data.profile
  const { error } = await sb.from('profiles').upsert({
    id: uid,
    display_name: p.displayName,
    avatar: p.avatar,
    daily_goal_minutes: p.dailyGoalMinutes,
    preferred_difficulty: p.preferredDifficulty,
    xp: p.xp,
    updated_at: new Date().toISOString(),
  })
  if (error) logFailure('profile', error.message)
}

/** Uploads one lesson-progress row. No-op unless signed in. */
export async function maybeSyncLessonProgress(progress: LessonProgress): Promise<void> {
  const sb = await getSupabase()
  const uid = currentUserId()
  if (!sb || !uid) return
  const { error } = await sb.from('lesson_progress').upsert({
    user_id: uid,
    lesson_id: progress.lessonId,
    status: progress.status,
    attempts: progress.attempts,
    best_accuracy: progress.bestAccuracy,
    best_wpm: progress.bestWpm,
    completed_at: progress.completedAt,
    updated_at: new Date().toISOString(),
  })
  if (error) logFailure('lesson progress', error.message)
}

/**
 * Pulls remote sessions after sign-in and merges them into the local store
 * (local wins on id conflicts). Returns the number of merged rows.
 */
export async function mergeRemoteSessions(): Promise<number> {
  const sb = await getSupabase()
  const uid = currentUserId()
  if (!sb || !uid) return 0
  const { data, error } = await sb
    .from('sessions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(120)
  if (error || !data) {
    if (error) logFailure('session fetch', error.message)
    return 0
  }

  const store = useSessionsStore.getState()
  const known = new Set(store.sessions.map((s) => s.id))
  const remote: TypingSession[] = data
    .filter((row) => !known.has(row.id))
    .map((row) => ({
      id: row.id,
      userId: row.user_id,
      mode: row.mode,
      source: row.source,
      practiceMode: row.practice_mode ?? undefined,
      lessonId: row.lesson_id ?? null,
      target: row.target,
      text: row.text,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      metrics: row.metrics,
      keyStats: row.key_stats ?? [],
      errors: row.errors ?? [],
      timeline: row.timeline ?? [],
    }))
  if (remote.length > 0) {
    useSessionsStore.setState({ sessions: [...remote, ...store.sessions].slice(0, 120) })
  }
  return remote.length
}

/** Pulls remote lesson progress for rows the local store has not completed. */
export async function mergeRemoteLessons(): Promise<void> {
  const sb = await getSupabase()
  const uid = currentUserId()
  if (!sb || !uid) return
  const { data, error } = await sb.from('lesson_progress').select('*')
  if (error || !data) {
    if (error) logFailure('lesson fetch', error.message)
    return
  }
  const local = useProgressStore.getState().lessonProgress
  const merged = { ...local }
  for (const row of data) {
    const existing = merged[row.lesson_id]
    const remote: LessonProgress = {
      lessonId: row.lesson_id,
      status: row.status,
      attempts: row.attempts,
      bestAccuracy: row.best_accuracy,
      bestWpm: row.best_wpm,
      completedAt: row.completed_at,
    }
    if (!existing || (remote.status === 'completed' && existing.status !== 'completed')) {
      merged[row.lesson_id] = { ...remote, attempts: Math.max(remote.attempts, existing?.attempts ?? 0) }
    } else {
      merged[row.lesson_id] = {
        ...existing,
        attempts: Math.max(existing.attempts, remote.attempts),
        bestAccuracy: Math.max(existing.bestAccuracy, remote.bestAccuracy),
        bestWpm: Math.max(existing.bestWpm, remote.bestWpm),
      }
    }
  }
  useProgressStore.setState({ lessonProgress: merged })
}
