import { LinkButton } from '@/components/ui'
import { KeyboardIcon } from 'lucide-react'

export function NotFound() {
  return (
    <div className="wire-grid flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-16 text-center">
      <p className="label label-accent mb-4">Error — page not found</p>
      <p className="hero-title text-primary" aria-hidden>
        404
      </p>
      <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-ink uppercase">
        That key doesn&apos;t exist
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">The page you&apos;re after slipped off the board.</p>
      <span className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton to="/">Home</LinkButton>
        <LinkButton to="/app" variant="secondary">
          Open app
        </LinkButton>
      </span>
      <span className="mt-10 text-ink-faint">
        <KeyboardIcon className="size-6" aria-hidden />
      </span>
    </div>
  )
}
