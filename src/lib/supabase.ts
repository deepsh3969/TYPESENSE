import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

export const googleAuthEnabled = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true'

let client: SupabaseClient | null = null

/** Lazily create the client so an unconfigured app never throws at import time. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }
  return client
}

export const supabaseEnv = { url: url ?? '', anonKey: anonKey ?? '' }
