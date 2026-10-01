import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useReducedMotionPref } from '@/hooks/useTheme'
import { initAuth, useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { mergeRemoteLessons, mergeRemoteSessions } from '@/services/sync'
import { AppShell } from '@/layouts/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { NotFound } from '@/pages/NotFound'
import { isSupabaseConfigured } from '@/lib/supabase'

// route-level code splitting keeps the landing + shell initial bundle small
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const TypingTest = lazy(() => import('@/pages/TypingTest').then((m) => ({ default: m.TypingTest })))
const Practice = lazy(() =>
  import('@/pages/Practice').then((m) => ({ default: m.PracticeIndex })),
)
const PracticeDetail = lazy(() =>
  import('@/pages/Practice').then((m) => ({ default: m.PracticeDetail })),
)
const Lessons = lazy(() => import('@/pages/Lessons').then((m) => ({ default: m.Lessons })))
const LessonDetail = lazy(() => import('@/pages/LessonDetail').then((m) => ({ default: m.LessonDetail })))
const Mistakes = lazy(() => import('@/pages/Mistakes').then((m) => ({ default: m.Mistakes })))
const ProgressPage = lazy(() => import('@/pages/Progress').then((m) => ({ default: m.ProgressPage })))
const Achievements = lazy(() => import('@/pages/Achievements').then((m) => ({ default: m.Achievements })))
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))

export default function App() {
  useReducedMotionPref()

  const authUser = useAuthStore((s) => s.user)
  const setProfile = useUserStore((s) => s.setProfile)

  // subscribe to Supabase auth (no-op when unconfigured)
  useEffect(() => {
    let unsub = (): void => undefined
    let cancelled = false
    void initAuth().then((u) => {
      if (cancelled) u()
      else unsub = u
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  // flip profile mode + pull remote data when a session appears / disappears
  useEffect(() => {
    if (authUser) {
      setProfile({ mode: isSupabaseConfigured ? 'cloud' : 'local' })
      if (authUser.displayName) setProfile({ displayName: authUser.displayName })
      if (isSupabaseConfigured) {
        void mergeRemoteSessions()
        void mergeRemoteLessons()
      }
    } else {
      setProfile({ mode: 'local' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser])

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-bg" role="status" aria-label="Loading">
            <span className="size-7 animate-spin rounded-full border-[3px] border-line border-t-primary" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="test" element={<TypingTest />} />
            <Route path="practice" element={<Practice />} />
            <Route path="practice/:mode" element={<PracticeDetail />} />
            <Route path="lessons" element={<Lessons />} />
            <Route path="lessons/:id" element={<LessonDetail />} />
            <Route path="mistakes" element={<Mistakes />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
