import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNav } from '@/components/layout/MobileNav'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const DEFAULT_TITLE = typeof document !== 'undefined' ? document.title : 'TypeSense'

const PAGE_TITLES: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/test': 'Typing Test',
  '/app/practice': 'Practice',
  '/app/lessons': 'Lessons',
  '/app/mistakes': 'Mistakes',
  '/app/progress': 'Progress',
  '/app/achievements': 'Achievements',
  '/app/profile': 'Profile',
  '/app/settings': 'Settings',
}

function titleFor(pathname: string): string {
  const exact = PAGE_TITLES[pathname]
  if (exact) return exact
  if (pathname.startsWith('/app/practice/')) return 'Practice Drill'
  if (pathname.startsWith('/app/lessons/')) return 'Lesson'
  return 'Dashboard'
}

export function AppShell() {
  const location = useLocation()
  const reduced = useReducedMotion()

  // per-route document title + move focus to main content for screen readers
  useEffect(() => {
    document.title = `${titleFor(location.pathname)} · TypeSense`
    const main = document.getElementById('main')
    if (main) {
      main.setAttribute('tabindex', '-1')
      main.focus({ preventScroll: true })
    }
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [location.pathname])

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main" className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <ErrorBoundary
                  fallback={(reset) => (
                    <div role="alert" className="card mx-auto max-w-md p-6 text-center">
                      <h2 className="text-lg font-extrabold text-ink">This page hit an error</h2>
                      <p className="mt-2 text-sm text-ink-muted">
                        The rest of the app is still running — your data is safe.
                      </p>
                      <div className="mt-4 flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={reset}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                        >
                          Try again
                        </button>
                        <button
                          type="button"
                          onClick={() => window.location.reload()}
                          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
                        >
                          Reload
                        </button>
                      </div>
                    </div>
                  )}
                >
                  <Outlet />
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <MobileNav />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
    </div>
  )
}
