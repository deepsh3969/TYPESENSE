import { create } from 'zustand'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { restoreLocalSession, signInLocal, signOutLocal, signUpLocal } from '@/services/localAuth'

export interface AuthUser {
  id: string
  email: string
  displayName?: string
}

type AuthResult = { error: string | null; message?: string }

interface AuthState {
  user: AuthUser | null
  initialized: boolean
  /** an auth action (sign-in / sign-up / sign-out) is in flight */
  pending: boolean
  setUser: (user: AuthUser | null) => void
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>
  signUpWithPassword: (email: string, password: string, displayName?: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

function friendlySupabaseError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (m.includes('password should be at least')) return 'Password must be at least 8 characters.'
  if (m.includes('email not confirmed')) return 'Confirm your email first, then sign in.'
  if (m.includes('rate limit')) return 'Too many attempts — wait a moment and try again.'
  return message
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  // unconfigured apps run in local mode immediately (session may restore below)
  initialized: !isSupabaseConfigured,
  pending: false,
  setUser: (user) => set({ user, initialized: true }),

  signInWithPassword: async (email, password) => {
    set({ pending: true })
    try {
      const sb = await getSupabase()
      if (sb) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password })
        if (error) return { error: friendlySupabaseError(error.message) }
        const u = data.user
        if (u) set({ user: { id: u.id, email: u.email ?? '', displayName: (u.user_metadata?.display_name as string) ?? undefined } })
        return { error: null }
      }
      const user = await signInLocal(email, password)
      set({ user: { ...user } })
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign-in failed.' }
    } finally {
      set({ pending: false })
    }
  },

  signUpWithPassword: async (email, password, displayName) => {
    set({ pending: true })
    try {
      const sb = await getSupabase()
      if (sb) {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName ?? null }, emailRedirectTo: window.location.origin },
        })
        if (error) return { error: friendlySupabaseError(error.message) }
        if (!data.session) {
          return { error: null, message: 'Account created — check your inbox to confirm your email.' }
        }
        const u = data.user
        if (u) set({ user: { id: u.id, email: u.email ?? '', displayName: displayName ?? undefined } })
        return { error: null }
      }
      const user = await signUpLocal(email, password, displayName)
      set({ user: { ...user } })
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign-up failed.' }
    } finally {
      set({ pending: false })
    }
  },

  signOut: async () => {
    const sb = await getSupabase()
    if (sb) await sb.auth.signOut()
    signOutLocal()
    set({ user: null })
  },
}))

/**
 * Subscribes to Supabase auth changes and restores a local device session.
 * Safe to call when Supabase is not configured — it becomes a no-op for the
 * remote half while still restoring local accounts. Returns an unsubscribe.
 */
export function initAuth(): Promise<() => void> {
  // restore a device account immediately (sessionStorage — ends with the tab)
  const local = restoreLocalSession()
  if (local) useAuthStore.getState().setUser({ ...local })

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
