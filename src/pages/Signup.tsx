import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, ShieldCheck, UserPlus } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuthStore } from '@/stores/authStore'
import { isSupabaseConfigured } from '@/lib/supabase'

export function Signup() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const pending = useAuthStore((s) => s.pending)
  const signUp = useAuthStore((s) => s.signUpWithPassword)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    document.title = 'Create account · TypeSense'
  }, [])

  useEffect(() => {
    if (user) navigate('/app', { replace: true })
  }, [user, navigate])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    const result = await signUp(email, password, name)
    if (result.error) setError(result.error)
    else if (result.message) setNotice(result.message)
  }

  return (
    <AuthLayout
      kicker="Start today"
      headline={['BUILD YOUR', 'RECORD.']}
      description="An account turns practice into proof — every session, unlocked achievement and streak is saved under your identity."
      points={[
        'One login across devices when sync is enabled',
        'Your XP, levels and achievements travel with you',
        'Guest mode works too — upgrade whenever you like',
      ]}
    >
      <p className="label label-accent mb-3">Create account</p>
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink uppercase sm:text-4xl">
        Start your record
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Email + password — that is the whole ritual. 8 characters minimum.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <div>
          <label htmlFor="signup-name" className="label mb-2 block">
            Display name <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <Input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Typist"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="label mb-2 block">
            Email
          </label>
          <Input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="label mb-2 block">
            Password
          </label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
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
          <p className="mt-1.5 text-[11px] text-ink-faint">Minimum 8 characters.</p>
        </div>

        <div>
          <label htmlFor="signup-confirm" className="label mb-2 block">
            Confirm password
          </label>
          <Input
            id="signup-confirm"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
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
          <UserPlus className="size-4" /> Create account
        </Button>
      </form>

      <div className="mt-8 flex items-center justify-between border-t border-line pt-5 text-sm">
        <span className="text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Sign in
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
