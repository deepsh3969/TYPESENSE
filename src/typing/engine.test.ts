import { describe, expect, it } from 'vitest'
import { TypingEngine, finalizeSession, physicalKey } from './engine'
import { computeMetrics, computeConsistency } from './metrics'

/** Controllable clock so timing behaviour is deterministic. */
function makeClock(start = 0) {
  let t = start
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms
    },
    set: (ms: number) => {
      t = ms
    },
  }
}

function typeText(engine: TypingEngine, clock: ReturnType<typeof makeClock>, text: string, delay = 80) {
  for (const ch of text) {
    clock.advance(delay)
    engine.press(ch)
  }
}

describe('physicalKey', () => {
  it('lowercases letters and names space', () => {
    expect(physicalKey('R')).toBe('r')
    expect(physicalKey('t')).toBe('t')
    expect(physicalKey(' ')).toBe('space')
    expect(physicalKey('5')).toBe('5')
    expect(physicalKey('?')).toBe('?')
  })
})

describe('TypingEngine — correct input', () => {
  it('advances the cursor and marks slots correct', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'hi', now: clock.now })
    clock.advance(50)
    engine.press('h')
    clock.advance(50)
    engine.press('i')
    expect(engine.index).toBe(2)
    expect(engine.slots[0].state).toBe('correct')
    expect(engine.slots[1].state).toBe('correct')
    expect(engine.finished).toBe(true)
  })

  it('counts correct slots and keystrokes', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'abc', now: clock.now })
    typeText(engine, clock, 'abc')
    const c = engine.counters
    expect(c.correctKeystrokes).toBe(3)
    expect(c.totalKeystrokes).toBe(3)
    expect(c.correctSlots).toBe(3)
    expect(c.uncorrectedErrors).toBe(0)
  })
})

describe('TypingEngine — errors and corrections', () => {
  it('marks wrong characters and tracks uncorrected errors', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'cat', now: clock.now })
    clock.advance(60)
    engine.press('c')
    clock.advance(60)
    engine.press('x') // wrong for 'a'
    expect(engine.slots[1].state).toBe('wrong')
    expect(engine.counters.uncorrectedErrors).toBe(1)
    expect(engine.counters.correctKeystrokes).toBe(1)
    expect(engine.counters.totalKeystrokes).toBe(2)
  })

  it('backspace corrects an error and records the correction', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'cat', now: clock.now })
    clock.advance(60)
    engine.press('c')
    clock.advance(60)
    engine.press('x')
    clock.advance(120)
    const removed = engine.backspace()
    expect(removed).toBe(1)
    expect(engine.index).toBe(1)
    expect(engine.slots[1].state).toBe('pending')
    const errors = engine.getErrors()
    expect(errors).toHaveLength(1)
    expect(errors[0].corrected).toBe(true)
    expect(errors[0].correctionMs).not.toBeNull()
    expect(engine.counters.uncorrectedErrors).toBe(0)
    expect(engine.counters.corrections).toBe(1)

    clock.advance(60)
    engine.press('a')
    expect(engine.slots[1].state).toBe('correct')
    expect(engine.getErrors()).toHaveLength(1)
    expect(engine.getErrors()[0].corrected).toBe(true)
  })

  it('wordwise backspace removes the whole word', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'hello world', now: clock.now })
    typeText(engine, clock, 'hello w')
    const removed = engine.backspace(true)
    expect(removed).toBe(1) // only 'w' after the space
    expect(engine.index).toBe(6)
    const removed2 = engine.backspace(true)
    expect(removed2).toBe(6) // removes the space + 'hello'
    expect(engine.index).toBe(0)
  })

  it('does not allow backspace before the first character', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'abc', now: clock.now })
    clock.advance(10)
    engine.press('a')
    expect(engine.backspace()).toBe(1)
    expect(engine.backspace()).toBe(0)
    expect(engine.index).toBe(0)
  })
})

describe('TypingEngine — error classification', () => {
  it('detects transposition on the second character', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'th', now: clock.now })
    clock.advance(60)
    engine.press('h')
    clock.advance(60)
    engine.press('t')
    const errors = engine.getErrors()
    expect(errors).toHaveLength(2)
    expect(errors[0].category).toBe('transposition')
    expect(errors[1].category).toBe('transposition')
  })

  it('detects capitalization errors', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'The', now: clock.now })
    clock.advance(60)
    engine.press('t')
    expect(engine.getErrors()[0].category).toBe('capitalization')
  })

  it('detects extra characters where a space is expected', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'a b', now: clock.now })
    clock.advance(60)
    engine.press('a')
    clock.advance(60)
    engine.press('x') // space expected
    expect(engine.getErrors()[0].category).toBe('extra')
  })

  it('detects space errors where content is expected', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'ab', now: clock.now })
    clock.advance(60)
    engine.press(' ')
    expect(engine.getErrors()[0].category).toBe('space')
  })

  it('detects missing characters when typing ahead', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'the', now: clock.now })
    clock.advance(60)
    engine.press('t')
    clock.advance(60)
    engine.press('e') // skips 'h'
    expect(engine.getErrors()[0].category).toBe('missing')
  })

  it('detects punctuation and number errors', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'a. 5', now: clock.now })
    clock.advance(60)
    engine.press('a')
    clock.advance(60)
    engine.press(',')
    clock.advance(60)
    engine.press(' ')
    clock.advance(60)
    engine.press('6')
    const cats = engine.getErrors().map((e) => e.category)
    expect(cats).toEqual(['punctuation', 'number'])
  })

  it('flags repeated word errors', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'go go', now: clock.now })
    // first "go": mistype the first char
    clock.advance(60)
    engine.press('x') // wrong for 'g'
    clock.advance(60)
    engine.press('o')
    clock.advance(60)
    engine.press(' ')
    clock.advance(60)
    engine.press('x') // wrong for 'g' again
    const cats = engine.getErrors().map((e) => e.category)
    expect(cats[1]).toBe('repeated-word')
  })

  it('records slow characters separately from errors', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'abcdef', now: clock.now })
    for (const ch of 'abc') {
      clock.advance(80)
      engine.press(ch)
    }
    clock.advance(3000) // slow
    engine.press('d')
    const all = engine.getErrors()
    expect(all.some((e) => e.category === 'slow')).toBe(true)
    const metrics = computeMetrics(engine.counters, engine.timing, engine.elapsed())
    // slow records must not count as mistakes
    expect(all.filter((e) => e.category !== 'slow')).toHaveLength(0)
    expect(metrics).toBeDefined()
  })
})

describe('TypingEngine — timing', () => {
  it('starts the clock on first keystroke', () => {
    const clock = makeClock(5000)
    const engine = new TypingEngine({ text: 'a', now: clock.now })
    expect(engine.started).toBe(false)
    clock.advance(1000)
    engine.press('a')
    expect(engine.started).toBe(true)
    expect(engine.elapsed()).toBe(0)
  })

  it('enforces the duration limit', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'abcdefgh', durationLimitMs: 1000, now: clock.now })
    clock.advance(100)
    engine.press('a')
    clock.advance(1500)
    expect(engine.shouldStop()).toBe(true)
    // further input ignored
    expect(engine.press('b')).toBeNull()
    expect(engine.index).toBe(1)
  })

  it('records pauses longer than the threshold', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'ab', now: clock.now })
    clock.advance(50)
    engine.press('a')
    clock.advance(5000)
    engine.press('b')
    expect(engine.timing.pauses).toHaveLength(1)
    expect(engine.timing.delays).toHaveLength(0)
  })

  it('computes consistency in 0..1', () => {
    const c = computeConsistency([100, 100, 100, 100])
    expect(c).toBeCloseTo(1)
    const c2 = computeConsistency([50, 200, 60, 300, 40, 250])
    expect(c2).toBeLessThan(0.7)
    expect(c2).toBeGreaterThanOrEqual(0)
  })

  it('ignores input before start and after finish', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'a', now: clock.now })
    expect(engine.backspace()).toBe(0)
    clock.advance(10)
    engine.press('a')
    expect(engine.finished).toBe(true)
    expect(engine.press('b')).toBeNull()
  })
})

describe('TypingEngine — stats', () => {
  it('tracks per-key attempts, errors and corrections', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'rrr', now: clock.now })
    clock.advance(50)
    engine.press('t') // wrong for r
    clock.advance(50)
    engine.backspace()
    clock.advance(50)
    engine.press('r')
    clock.advance(50)
    engine.press('r')
    clock.advance(50)
    engine.press('r')
    const stat = engine.getKeyStats().get('r')
    expect(stat?.attempts).toBe(4) // 1 wrong attempt + 3 correct
    expect(stat?.errors).toBe(1)
    expect(stat?.corrections).toBe(1)
    const tStat = engine.getKeyStats().get('t')
    expect(tStat).toBeUndefined() // attempts are credited to the EXPECTED key
  })

  it('never credits attempts to a key that was not expected', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'ab', now: clock.now })
    clock.advance(50)
    engine.press('x')
    expect(engine.getKeyStats().get('a')?.errors).toBe(1)
    expect(engine.getKeyStats().get('x')).toBeUndefined()
  })
})

describe('finalizeSession', () => {
  it('produces a complete session record', () => {
    const clock = makeClock()
    const engine = new TypingEngine({ text: 'hi there', now: clock.now })
    clock.advance(100)
    engine.press('h')
    clock.advance(90)
    engine.press('x') // wrong
    clock.advance(100)
    engine.backspace()
    clock.advance(80)
    engine.press('i')
    clock.advance(90)
    engine.press(' ')
    clock.advance(90)
    engine.press('t')
    clock.advance(10000)
    engine.press('h')
    clock.advance(80)
    engine.press('e')
    clock.advance(80)
    engine.press('r')
    clock.advance(80)
    engine.press('e')

    const session = finalizeSession(engine, {
      id: 's1',
      userId: null,
      mode: 'words',
      source: 'test',
      target: 2,
      startedAtIso: new Date().toISOString(),
      finishedAtIso: new Date().toISOString(),
    })

    expect(session.metrics.errors).toBe(1)
    expect(session.metrics.uncorrectedErrors).toBe(0)
    expect(session.metrics.corrections).toBe(1)
    expect(session.metrics.correctChars).toBe(8)
    expect(session.metrics.elapsedMs).toBeGreaterThan(10000)
    expect(session.metrics.consistency).toBeGreaterThan(0)
    expect(session.errors.length).toBeGreaterThanOrEqual(1)
    expect(session.keyStats.length).toBeGreaterThan(0)
    expect(session.text).toBe('hi there')
  })
})
