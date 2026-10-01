import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { TypingEngine } from '@/typing/engine'
import { MEDIUM_PASSAGES } from '@/data/passages'
import { TypingArea } from '@/components/typing/TypingArea'

function nextPassage(): string {
  return MEDIUM_PASSAGES[Math.floor(Math.random() * MEDIUM_PASSAGES.length)]
}

/** A self-driving typing demo: the real engine types (and fixes) the passage. */
export function HeroDemo() {
  const reduced = useReducedMotion()
  const engineRef = useRef<TypingEngine | null>(null)
  if (engineRef.current === null) engineRef.current = new TypingEngine({ text: nextPassage() })
  const [, setTick] = useState(0)
  const wrongNext = useRef(false)

  useEffect(() => {
    if (reduced) return
    const timer = window.setInterval(() => {
  const engine = engineRef.current
  if (!engine) return null
      if (!engine) return
      if (engine.finished) {
        engineRef.current = new TypingEngine({ text: nextPassage() })
        wrongNext.current = false
        setTick((t) => t + 1)
        return
      }
      if (wrongNext.current) {
        engine.backspace()
        wrongNext.current = false
        setTick((t) => t + 1)
        return
      }
      const expected = engine.text[engine.index]
      if (expected === undefined) return
      if (expected !== ' ' && Math.random() < 0.055 && engine.index > 6) {
        const wrong = expected === 'e' ? 'r' : 'e'
        engine.press(wrong)
        wrongNext.current = true
      } else {
        engine.press(expected)
      }
      setTick((t) => t + 1)
    }, 78)
    return () => window.clearInterval(timer)
  }, [reduced])

  const engine = engineRef.current

  return (
    <div className="pointer-events-none select-none" aria-hidden>
      <div className="rounded-2xl border border-line bg-surface/80 p-4 shadow-2xl shadow-primary/10 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            live engine
          </span>
          <span className="text-[11px] font-semibold text-ink-faint">92 WPM · 98% acc</span>
        </div>
        <TypingArea
          slots={engine.slots}
          index={engine.index}
          text={engine.text}
          running
          className="border-0 bg-surface-2/60 p-3"
        />
      </div>
    </div>
  )
}
