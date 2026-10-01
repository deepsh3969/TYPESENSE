import { create } from 'zustand'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email: string
}

interface AuthState {
  user: AuthUser | null
  initialized: boolean
  setUser: (user: AuthUser | null) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  // unconfigured apps run in local mode immediately
  initialized: !isSupabaseConfigured,
  setUser: (user) => set({ user, initialized: true }),
  signOut: async () => {
    const sb = await getSupabase()
    if (sb) await sb.auth.signOut()
    set({ user: null })
  },
}))

/**
 * Subscribes to Supabase auth changes. Safe to call when Supabase is not
 * configured — it becomes a no-op and the app stays in local mode.
 * Returns a promise resolving to an unsubscribe function.
 */
export function initAuth(): Promise<() => void> {
  return getSupabase().then((sb) => {
    if (!sb) return () => undefined

    const applyUser = async () => {
      const { data } = await sb.auth.getUser()
      const user = data.user
      useAuthStore
        .getState()
        .setUser(user ? { id: user.id, email: user.email ?? '' } : null)
    }
    void applyUser()

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      useAuthStore
        .getState()
        .setUser(session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null)
    })

    return () => sub.subscription.unsubscribe()
  })
}
