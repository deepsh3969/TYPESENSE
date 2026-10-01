import { useState, type FormEvent } from 'react'
import { KeyboardIcon, Mail, ShieldCheck } from 'lucide-react'
import { Button, Card, Input, LinkButton } from '@/components/ui'
import { getSupabase, googleAuthEnabled, isSupabaseConfigured } from '@/lib/supabase'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const sendLink = async (e: FormEvent) => {
    e.preventDefault()
    const sb = getSupabase()
    if (!sb) return
    setStatus('sending')
    setError('')
    const { error: err } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (err) {
      setStatus('error')
      setError(err.message)
    } else {
      setStatus('sent')
    }
  }

  const signInWithGoogle = async () => {
    const sb = getSupabase()
    if (!sb) return
    const { error: err } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
            <KeyboardIcon className="size-5" aria-hidden />
          </span>
          <span className="text-base font-extrabold tracking-tight text-ink">
            TYPE<span className="text-primary">SENSE</span>
          </span>
        </div>

        {!isSupabaseConfigured ? (
          <>
            <h1 className="mt-6 text-xl font-extrabold text-ink">Accounts are optional</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              TypeSense runs fully offline by default — your sessions, XP and streak live in this
              browser. Connect a Supabase project to enable magic-link sign-in and cross-device sync.
            </p>
            <div className="mt-4 rounded-xl border border-line bg-surface-2/60 p-4 text-xs leading-relaxed text-ink-muted">
              <p className="mb-1.5 font-bold text-ink">Enable accounts</p>
              <code className="block font-mono text-[11px]">
                VITE_SUPABASE_URL=your-project-url
                <br />
                VITE_SUPABASE_ANON_KEY=your-anon-key
              </code>
              <p className="mt-2">See <span className="font-semibold">.env.example</span> and README for the SQL migrations.</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton to="/app">Continue as guest</LinkButton>
              <LinkButton to="/" variant="ghost">Back home</LinkButton>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-xl font-extrabold text-ink">Welcome back</h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              Sign in with a magic link — no password to remember.
            </p>

            {status === 'sent' ? (
              <div className="mt-6 rounded-xl border border-success/40 bg-success/5 p-4">
                <p className="text-sm font-bold text-ink">Check your inbox</p>
                <p className="mt-1 text-xs text-ink-muted">
                  We sent a sign-in link to <span className="font-semibold">{email}</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={sendLink} className="mt-6 space-y-4">
                <label htmlFor="auth-email" className="block text-sm font-semibold text-ink">
                  Email
                </label>
                <Input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
                {status === 'error' && (
                  <p className="text-xs font-medium text-danger" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" loading={status === 'sending'} className="w-full">
                  <Mail className="size-4" /> Send magic link
                </Button>
                {googleAuthEnabled && (
                  <>
                    <div className="flex items-center gap-3 text-[11px] text-ink-faint">
                      <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
                    </div>
                    <Button type="button" variant="outline" className="w-full" onClick={signInWithGoogle}>
                      Continue with Google
                    </Button>
                  </>
                )}
              </form>
            )}

            <div className="mt-6 flex items-center justify-between text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-success" /> RLS-protected
              </span>
              <LinkButton to="/app" variant="ghost" size="sm" className="h-auto p-0">
                Skip for now
              </LinkButton>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
