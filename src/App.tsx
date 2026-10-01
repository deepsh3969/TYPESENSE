import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useReducedMotionPref } from '@/hooks/useTheme'
import { initAuth, useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { mergeRemoteLessons, mergeRemoteSessions } from '@/services/sync'
import { AppShell } from '@/layouts/AppShell'
import { Landing } from '@/pages/Landing'
import { AuthPage } from '@/pages/Auth'
import { Dashboard } from '@/pages/Dashboard'
import { TypingTest } from '@/pages/TypingTest'
import { PracticeIndex, PracticeDetail } from '@/pages/Practice'
import { Lessons } from '@/pages/Lessons'
import { LessonDetail } from '@/pages/LessonDetail'
import { Mistakes } from '@/pages/Mistakes'
import { ProgressPage } from '@/pages/Progress'
import { Achievements } from '@/pages/Achievements'
import { Profile } from '@/pages/Profile'
import { Settings } from '@/pages/Settings'
import { NotFound } from '@/pages/NotFound'

export default function App() {
  useReducedMotionPref()

  const authUser = useAuthStore((s) => s.user)
  const setProfile = useUserStore((s) => s.setProfile)

  // subscribe to Supabase auth (no-op when unconfigured)
  useEffect(() => initAuth(), [])

  // flip profile mode + pull remote data when a session appears / disappears
  useEffect(() => {
    if (authUser) {
      setProfile({ mode: 'cloud' })
      void mergeRemoteSessions()
      void mergeRemoteLessons()
    } else {
      setProfile({ mode: 'local' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser])

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="test" element={<TypingTest />} />
        <Route path="practice" element={<PracticeIndex />} />
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
  )
}
