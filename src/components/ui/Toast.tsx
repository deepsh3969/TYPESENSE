import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Award, Flame, Sparkles, X, Zap, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastData {
  id: number
  title: string
  detail?: string
  icon: 'xp' | 'achievement' | 'levelup' | 'streak' | 'goal'
  tone?: 'primary' | 'success'
}

const ICONS: Record<ToastData['icon'], LucideIcon> = {
  xp: Zap,
  achievement: Award,
  levelup: Sparkles,
  streak: Flame,
  goal: Flame,
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const nextId = useRef(1)

  const push = useCallback((data: Omit<ToastData, 'id'>) => {
    const id = nextId.current++
    setToasts((list) => [...list.slice(-3), { ...data, id }])
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 5200)
    return id
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  return { toasts, push, dismiss }
}

export function ToastStack({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: number) => void }) {
  const reduced = useReducedMotion()
  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-50 flex w-[min(340px,calc(100vw-2rem))] flex-col gap-2 lg:bottom-6">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICONS[t.icon]
          return (
            <motion.div
              key={t.id}
              layout
              initial={reduced ? false : { opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface p-3 shadow-xl"
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  t.tone === 'success' ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary',
                )}
              >
                <Icon className="size-4.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{t.title}</p>
                {t.detail && <p className="mt-0.5 text-xs text-ink-muted">{t.detail}</p>}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="rounded-md p-1 text-ink-faint transition-colors hover:text-ink"
                aria-label="Dismiss"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
