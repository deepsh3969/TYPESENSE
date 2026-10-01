import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TypingSession } from '@/types/typing'

const MAX_SESSIONS = 120

interface SessionsStore {
  sessions: TypingSession[]
  addSession: (session: TypingSession) => void
  removeSession: (id: string) => void
  clearSessions: () => void
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
    { name: 'typesense-sessions', version: 1 },
  ),
)

/** Most recent sessions, newest first. */
export function selectRecentSessions(sessions: TypingSession[], limit: number): TypingSession[] {
  return sessions.slice(0, limit)
}
