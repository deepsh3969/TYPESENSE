import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toAccuracyRatio } from '@/lib/accuracy'
import type { TypingSession } from '@/types/typing'

const MAX_SESSIONS = 120

interface SessionsStore {
  sessions: TypingSession[]
  addSession: (session: TypingSession) => void
  removeSession: (id: string) => void
  clearSessions: () => void
}

/** Accuracy contract (ratio 0..1) — idempotent for canonical data. */
export function normalizeSession(s: TypingSession): TypingSession {
  const m = s.metrics
  return {
    ...s,
    metrics: {
      ...m,
      accuracy: toAccuracyRatio(m.accuracy),
      finalAccuracy: toAccuracyRatio(m.finalAccuracy),
      // legacy default was 100 "no mistakes"; the contract now stores 0
      correctionRate:
        m.corrections === 0 && m.uncorrectedErrors === 0
          ? 0
          : toAccuracyRatio(m.correctionRate),
    },
    timeline: (s.timeline ?? []).map((p) => ({ ...p, accuracy: toAccuracyRatio(p.accuracy) })),
  }
}

export const useSessionsStore = create<SessionsStore>()(
  persist(
    (set) => ({
      sessions: [],
      addSession: (session) =>
        set((s) => ({ sessions: [session, ...s.sessions].slice(0, MAX_SESSIONS) })),
      removeSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      clearSessions: () => set({ sessions: [] }),
    }),
    {
      name: 'typesense-sessions',
      version: 2,
      migrate: (persisted) => {
        const p = persisted as Partial<SessionsStore> | undefined
        return { sessions: (p?.sessions ?? []).map(normalizeSession) } as SessionsStore
      },
    },
  ),
)

/** Most recent sessions, newest first. */
export function selectRecentSessions(sessions: TypingSession[], limit: number): TypingSession[] {
  return sessions.slice(0, limit)
}
