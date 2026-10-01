import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TypingEngine, finalizeSession, type CharSlot } from '@/typing/engine'
import type { SessionSource, TypingMode, TypingSession } from '@/types/typing'
import { createId } from '@/lib/id'
import { roundAccuracy } from '@/lib/accuracy'

export type SessionStatus = 'idle' | 'running' | 'done'

export interface SessionSetup {
  text: string
  mode: TypingMode
  source: SessionSource
  /** words count or seconds — stored on the session record */
  target: number
  durationMs?: number
  practiceMode?: string
  lessonId?: string | null
}

export interface LiveSnapshot {
  wpm: number
  grossWpm: number
  netWpm: number
  /** ratio 0–1 (0 before the first keystroke) */
  accuracy: number
  consistency: number
  errors: number
  corrections: number
  backspaces: number
  /** printable keystrokes so far — accuracy denominator (0 ⇒ no accuracy yet) */
  attempts: number
  elapsedMs: number
  remainingMs: number | null
  index: number
  progress: number
}

const IDLE_LIVE: LiveSnapshot = {
  wpm: 0,
  grossWpm: 0,
  netWpm: 0,
  accuracy: 0,
  consistency: 100,
  errors: 0,
  corrections: 0,
  backspaces: 0,
  attempts: 0,
  elapsedMs: 0,
  remainingMs: null,
  index: 0,
  progress: 0,
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/**
 * Drives one typing session: owns the engine, captures keystrokes on the
 * window, runs the sample loop and finalises a TypingSession on completion.
 */
export function useTypingSession(setup: SessionSetup, onFinish?: (session: TypingSession) => void) {
  const engineRef = useRef<TypingEngine | null>(null)
  const [version, setVersion] = useState(0)
  const [status, setStatus] = useState<SessionStatus>('idle')
  const statusRef = useRef<SessionStatus>('idle')
  const setupRef = useRef(setup)
  const finishRef = useRef(onFinish)
  const startedAtIsoRef = useRef('')
  const finishedRef = useRef(false)

  useEffect(() => {
    setupRef.current = setup
  })
  useEffect(() => {
    finishRef.current = onFinish
  })

  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const complete = useCallback(
    (engine: TypingEngine) => {
      if (finishedRef.current) return
      finishedRef.current = true
      statusRef.current = 'done'
      setStatus('done')
      const s = setupRef.current
      const session = finalizeSession(engine, {
        id: createId('sess'),
        userId: null,
        mode: s.mode,
        source: s.source,
        practiceMode: s.practiceMode,
        lessonId: s.lessonId ?? null,
        target: s.target,
        startedAtIso: startedAtIsoRef.current || new Date().toISOString(),
        finishedAtIso: new Date().toISOString(),
      })
      finishRef.current?.(session)
      setVersion((v) => v + 1)
    },
    [],
  )

  const afterInput = useCallback(
    (engine: TypingEngine) => {
      if (engine.finished) complete(engine)
      bump()
    },
    [bump, complete],
  )

  // (re)create the engine whenever the text or duration changes
  const engineKey = `${setup.text}\u0000${setup.durationMs ?? 0}`
  useEffect(() => {
    engineRef.current = new TypingEngine({ text: setup.text, durationLimitMs: setup.durationMs })
    statusRef.current = 'idle'
    finishedRef.current = false
    startedAtIsoRef.current = ''
    setStatus('idle')
    setVersion((v) => v + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineKey])

  // keystroke capture — attached once, reads current state through refs
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current
      if (!engine || engine.finished || finishedRef.current || isEditableTarget(e.target)) return

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Backspace') {
          e.preventDefault()
          engine.backspace(true)
          afterInput(engine)
        }
        return
      }
      if (e.altKey) return

      if (e.key === 'Backspace') {
        e.preventDefault()
        engine.backspace()
        afterInput(engine)
        return
      }
      if (e.key.length !== 1) return
      e.preventDefault()

      engine.press(e.key)
      if (statusRef.current === 'idle' && engine.started) {
        statusRef.current = 'running'
        startedAtIsoRef.current = new Date().toISOString()
        setStatus('running')
      }
      afterInput(engine)
    }

    const onPaste = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) return
      e.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('paste', onPaste)
    }
  }, [afterInput])

  // timer + sample loop while running
  useEffect(() => {
    if (status !== 'running') return
    let raf = 0
    let lastBump = performance.now()
    let lastSample = performance.now()
    const loop = () => {
      const engine = engineRef.current
      if (!engine) return
      const now = performance.now()
      if (now - lastBump >= 90) {
        lastBump = now
        setVersion((v) => v + 1)
      }
      if (now - lastSample >= 500) {
        lastSample = now
        engine.sample(now)
      }
      if (engine.shouldStop(now)) {
        complete(engine)
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [status, complete])

  const restart = useCallback(() => {
    const s = setupRef.current
    engineRef.current = new TypingEngine({ text: s.text, durationLimitMs: s.durationMs })
    statusRef.current = 'idle'
    finishedRef.current = false
    startedAtIsoRef.current = ''
    setStatus('idle')
    setVersion((v) => v + 1)
  }, [])

  const live: LiveSnapshot = useMemo(() => {
    const engine = engineRef.current
    if (!engine) return { ...IDLE_LIVE, remainingMs: setup.durationMs ?? null }
    const m = engine.liveMetrics()
    const elapsedMs = engine.elapsed()
    const duration = setup.durationMs
    const counters = engine.counters
    return {
      wpm: Math.round(m.wpm),
      grossWpm: Math.round(m.grossWpm),
      netWpm: Math.round(m.netWpm * 10) / 10,
      accuracy: roundAccuracy(m.accuracy),
      consistency: Math.round(m.consistency * 100),
      errors: counters.uncorrectedErrors,
      corrections: counters.corrections,
      backspaces: counters.backspaces,
      attempts: counters.totalKeystrokes,
      elapsedMs,
      remainingMs: duration !== undefined ? Math.max(0, duration - elapsedMs) : null,
      index: engine.index,
      progress: engine.text.length === 0 ? 0 : Math.min(100, (engine.index / engine.text.length) * 100),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, setup.durationMs])

  const engine = engineRef.current

  return {
    engine,
    slots: (engine?.slots ?? []) as readonly CharSlot[],
    status,
    live,
    index: live.index,
    version,
    restart,
    lastKey: engine?.lastKey ?? null,
    text: engine?.text ?? setup.text,
  }
}
