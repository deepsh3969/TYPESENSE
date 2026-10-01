import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LogIn, Mail, ShieldCheck } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuthStore } from '@/stores/authStore'
import { getSupabase, googleAuthEnabled, isSupabaseConfigured } from '@/lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const pending = useAuthStore((s) => s.pending)
  const signIn = useAuthStore((s) => s.signInWithPassword)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [magicSending, setMagicSending] = useState(false)

  useEffect(() => {
    document.title = 'Sign in · TypeSense'
  }, [])

  useEffect(() => {
    if (user) navigate('/app', { replace: true })
  }, [user, navigate])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    const result = await signIn(email, password)
    if (result.error) setError(result.error)
    else if (result.message) setNotice(result.message)
  }

  const sendMagicLink = async () => {
    const sb = await getSupabase()
    if (!sb || !email) return
    setMagicSending(true)
    setError('')
    const { error: err } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setMagicSending(false)
    if (err) setError(err.message)
    else setNotice(`Magic link sent to ${email} — check your inbox.`)
  }

  const signInWithGoogle = async () => {
    const sb = await getSupabase()
    if (!sb) return
    const { error: err } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (err) setError(err.message)
  }

  return (
    <AuthLayout
      kicker="Member access"
      headline={['WELCOME', 'BACK.']}
      description="Your streaks, XP, sessions and weakness maps follow you across devices — pick up exactly where the last test ended."
      points={[
        'Speed, accuracy and rhythm history in one place',
        'Adaptive lessons driven by your real mistakes',
        'Sync sessions securely — or stay fully local',
      ]}
    >
      <p className="label label-accent mb-3">Sign in</p>
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink uppercase sm:text-4xl">
        Continue your record
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Use your email and password — no magic-link dance required.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className="label mb-2 block">
            Email
          </label>
          <Input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="login-password" className="label mb-2 block">
            Password
          </label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 p-1 text-ink-faint transition-colors hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="border border-danger/50 bg-danger/10 px-3 py-2.5 text-xs font-semibold text-danger" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="border border-success/50 bg-success/10 px-3 py-2.5 text-xs font-semibold text-success" role="status">
            {notice}
          </p>
        )}

        <Button type="submit" loading={pending} className="w-full" size="lg">
          <LogIn className="size-4" /> Sign in
        </Button>

        {isSupabaseConfigured && (
          <>
            <div className="flex items-center gap-3 text-[11px] tracking-[0.12em] text-ink-faint uppercase">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                loading={magicSending}
                disabled={!email}
                onClick={sendMagicLink}
              >
                <Mail className="size-4" /> Magic link
              </Button>
              {googleAuthEnabled && (
                <Button type="button" variant="outline" className="flex-1" onClick={signInWithGoogle}>
                  Google
                </Button>
              )}
            </div>
          </>
        )}
      </form>

      <div className="mt-8 flex items-center justify-between border-t border-line pt-5 text-sm">
        <span className="text-ink-muted">
          New here?{' '}
          <Link to="/signup" className="font-bold text-primary hover:underline">
            Create an account
          </Link>
        </span>
        <Link
          to="/app"
          className="group flex items-center gap-1.5 text-xs font-bold tracking-[0.08em] text-ink-muted uppercase transition-colors hover:text-ink"
        >
          Continue as guest
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-[11px] text-ink-faint">
        <ShieldCheck className="size-3.5 text-success" />
        {isSupabaseConfigured
          ? 'Passwords are hashed by Supabase — we never see them.'
          : 'Stored on this device only — password hashed with PBKDF2, never in plain text.'}
      </p>
    </AuthLayout>
  )
}
