import { memo, useEffect, useMemo, useRef } from 'react'
import type { CharSlot } from '@/typing/engine'
import { cn } from '@/lib/utils'

interface WordView {
  chars: string[]
  states: string
  start: number
}

function buildWords(slots: readonly CharSlot[], text: string): WordView[] {
  const words: WordView[] = []
  let i = 0
  while (i < text.length) {
    if (text[i] === ' ') {
      i++
      continue
    }
    const start = i
    while (i < text.length && text[i] !== ' ') i++
    let end = i
    const hasSpace = i < text.length && text[i] === ' '
    if (hasSpace) end = i + 1
    const chars: string[] = new Array(end - start)
    let states = ''
    for (let p = start; p < end; p++) {
      const slot = slots[p]
      chars[p - start] = slot ? slot.char : text[p]
      states += slot ? (slot.state === 'correct' ? 'c' : slot.state === 'wrong' ? 'w' : 'p') : 'p'
    }
    words.push({ chars, states, start })
    i = end
  }
  return words
}

interface WordProps {
  chars: string[]
  states: string
  start: number
  active: boolean
  current: number
}

const Word = memo(function Word({ chars, states, start, active, current }: WordProps) {
  const local = current - start
  return (
    <span className="inline-flex">
      {chars.map((ch, i) => {
        const state = states[i]
        const isCaret = active && i === local
        const shown = ch === ' ' ? '\u00A0' : ch
        return (
          <span
            key={i}
            className={cn(
              'relative rounded-[3px]',
              state === 'p' && 'text-ink-faint',
              state === 'c' && 'text-ink',
              state === 'w' && 'bg-danger/15 text-danger shadow-[inset_0_-2px_0_var(--color-danger)]',
              isCaret && state !== 'w' && 'shadow-[inset_2px_0_0_var(--color-primary)] caret-blink',
            )}
          >
            {shown}
          </span>
        )
      })}
    </span>
  )
})

export interface TypingAreaProps {
  slots: readonly CharSlot[]
  index: number
  text: string
  running: boolean
  finished?: boolean
  className?: string
}

export function TypingArea({ slots, index, text, running, finished, className }: TypingAreaProps) {
  const words = useMemo(() => buildWords(slots, text), [slots, text, index])
  const activeWord = useMemo(() => {
    let found = -1
    for (let i = 0; i < words.length; i++) {
      const w = words[i]
      if (index >= w.start && index < w.start + w.chars.length) {
        found = i
        break
      }
    }
    return found
  }, [words, index])

  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLSpanElement>(null)
  const prevActive = useRef(-1)

  useEffect(() => {
    if (activeWord < 0 || activeWord === prevActive.current) return
    prevActive.current = activeWord
    const container = scrollRef.current
    const el = activeRef.current
    if (!container || !el) return
    const top = el.offsetTop
    const bottom = top + el.offsetHeight
    const viewTop = container.scrollTop
    const viewBottom = viewTop + container.clientHeight
    if (bottom > viewBottom - 4 || top < viewTop + 4) {
      container.scrollTop = Math.max(0, top - container.clientHeight * 0.4)
    }
  }, [activeWord, index])

  return (
    <div
      role="group"
      aria-label="Typing area"
      className={cn(
        'relative rounded-2xl border border-line bg-surface px-4 py-5 sm:px-6',
        finished && 'border-line',
        className,
      )}
    >
      <div
        ref={scrollRef}
        className="scrollbar-thin relative max-h-[168px] overflow-y-auto font-mono text-[19px] leading-[1.9] sm:text-[21px] sm:leading-[2]"
        aria-label="Text to type"
      >
        <div className="flex flex-wrap">
          {words.map((w, wi) => (
            <span key={w.start} ref={wi === activeWord ? activeRef : undefined}>
              <Word
                chars={w.chars}
                states={w.states}
                start={w.start}
                active={wi === activeWord}
                current={index}
              />
            </span>
          ))}
        </div>
      </div>
      {!running && !finished && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/70 backdrop-blur-[2px]">
          <span
            role="status"
            className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary"
          >
            Start typing to begin
          </span>
        </div>
      )}
    </div>
  )
}
