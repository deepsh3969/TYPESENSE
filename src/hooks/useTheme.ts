import { useEffect } from 'react'
import { useUiStore, applyTheme, type ThemeMode } from '@/stores/uiStore'

export function useTheme(): { theme: ThemeMode; setTheme: (mode: ThemeMode) => void } {
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  return { theme, setTheme }
}

export function useReducedMotionPref(): boolean {
  const setReducedMotion = useUiStore((s) => s.setReducedMotion)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [setReducedMotion])
  return useUiStore((s) => s.reducedMotion)
}
