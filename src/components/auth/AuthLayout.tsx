import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { KeyboardIcon } from 'lucide-react'

/** Shared split-screen editorial frame for /login and /signup. */
export function AuthLayout({
  kicker,
  headline,
  description,
  points,
  children,
}: {
  kicker: string
  headline: [string, string]
  description: string
  points: string[]
  children: ReactNode
}) {
  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[1.05fr_1fr]">
      {/* left — editorial brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-surface lg:flex lg:flex-col lg:justify-between">
        <div className="wire-grid absolute inset-0 opacity-60" aria-hidden />
        <div
          className="absolute -right-40 -bottom-48 size-[480px] rounded-full bg-primary/15 blur-[120px]"
          aria-hidden
        />

        <div className="relative z-10 flex items-center gap-3 p-8 xl:p-10">
          <span className="flex size-9 items-center justify-center bg-primary text-white">
            <KeyboardIcon className="size-5" aria-hidden />
          </span>
          <span className="font-display text-base font-bold tracking-tight">
            TYPE<span className="text-primary">SENSE</span>
          </span>
        </div>

        <div className="relative z-10 px-8 xl:px-10">
          <p className="label label-accent mb-4">{kicker}</p>
          {/* decorative brand headline — the form's h1 is the real page heading */}
          <p className="hero-title text-ink" aria-hidden>
            {headline[0]}
            <br />
            <span className="text-primary">{headline[1]}</span>
          </p>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-muted">{description}</p>

          <ul className="mt-8 max-w-md space-y-3 border-t border-line pt-6">
            {points.map((point, i) => (
              <li key={point} className="flex items-baseline gap-4 text-sm text-ink-muted">
                <span className="num text-xs font-bold text-primary">{String(i + 1).padStart(2, '0')}</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* wireframe keyboard motif */}
        <div className="relative z-10 flex justify-center overflow-hidden px-8 pb-6 xl:px-10" aria-hidden>
          <div
            className="w-full max-w-lg space-y-1.5 opacity-70"
            style={{ transform: 'perspective(700px) rotateX(58deg)', transformOrigin: 'bottom center' }}
          >
            {[13, 14, 13, 11, 6].map((keys, row) => (
              <div key={row} className="flex justify-center gap-1.5">
                {Array.from({ length: keys }, (_, k) => (
                  <span
                    key={k}
                    className={`h-6 flex-1 rounded-[2px] border ${
                      (row === 2 && k === 4) || (row === 3 && k === 7)
                        ? 'border-primary bg-primary/30'
                        : 'border-line bg-surface-2'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-line px-8 py-4 xl:px-10">
          <p className="label">Local-first · RLS-protected · Your data, your device</p>
        </div>
      </aside>

      {/* right — form */}
      <main className="flex flex-col items-center justify-center px-5 py-10 sm:px-8" id="main">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden" aria-label="TypeSense home">
            <span className="flex size-8 items-center justify-center bg-primary text-white">
              <KeyboardIcon className="size-4" aria-hidden />
            </span>
            <span className="font-display text-sm font-bold tracking-tight">
              TYPE<span className="text-primary">SENSE</span>
            </span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}
