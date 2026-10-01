import { describe, expect, it } from 'vitest'
import { classifyError, ERROR_CATEGORY_LABEL, type ClassifyInput } from '@/typing/classify'
import type { ErrorCategory } from '@/types/typing'

/** A neutral wrong-key mistake: typed 's' where 'd' was expected. */
function base(overrides: Partial<ClassifyInput> = {}): ClassifyInput {
  return {
    expected: 'd',
    typed: 's',
    index: 3,
    text: 'add dad',
    prevExpected: 'a',
    prevTyped: 'a',
    prevWrong: false,
    priorWordErrors: 0,
    ...overrides,
  }
}

describe('classifyError', () => {
  it('flags swapped neighbouring characters as a transposition', () => {
    // expected "...ab", typed "...ba" — prev slot holds 'b' while we press 'a'
    const category = classifyError(
      base({
        expected: 'b',
        typed: 'a',
        prevExpected: 'a',
        prevTyped: 'b',
        prevWrong: true,
      }),
    )
    expect(category).toBe('transposition')
  })

  it('does not flag a transposition when the previous slot was typed correctly', () => {
    expect(
      classifyError(
        base({
          expected: 'b',
          typed: 'a',
          prevExpected: 'a',
          prevTyped: 'a',
          prevWrong: false,
        }),
      ),
    ).not.toBe('transposition')
  })

  it('detects wrong-case letters as capitalization', () => {
    expect(classifyError(base({ expected: 'a', typed: 'A' }))).toBe('capitalization')
    expect(classifyError(base({ expected: 'T', typed: 't' }))).toBe('capitalization')
  })

  it('detects typing over a space as extra', () => {
    expect(classifyError(base({ expected: ' ', typed: 'x' }))).toBe('extra')
  })

  it('detects typing a space over content as space', () => {
    expect(classifyError(base({ expected: 'd', typed: ' ' }))).toBe('space')
  })

  it('detects skipping ahead as missing', () => {
    // expected 'd' at index 4 but we typed what belongs at index 5
    expect(classifyError(base({ expected: 'd', typed: 'a', index: 4, text: 'add da' }))).toBe('missing')
  })

  it('detects punctuation expectations', () => {
    expect(classifyError(base({ expected: '.', typed: ',', text: 'hi. th' }))).toBe('punctuation')
  })

  it('detects digit expectations', () => {
    expect(classifyError(base({ expected: '4', typed: '5', text: 'abc 42' }))).toBe('number')
  })

  it('flags repeat mistakes on the same word', () => {
    expect(classifyError(base({ priorWordErrors: 1 }))).toBe('repeated-word')
  })

  it('falls back to wrong-key for everything else', () => {
    expect(classifyError(base())).toBe('wrong-key')
  })

  it('applies the documented priority order', () => {
    // a space over content beats "next char" and punctuation fallbacks
    expect(classifyError(base({ expected: '.', typed: ' ' }))).toBe('space')
    // capitalization beats punctuation fallback
    expect(classifyError(base({ expected: 'A', typed: 'a', priorWordErrors: 1 }))).toBe('capitalization')
  })

  it('has a label for every category in the union', () => {
    const categories: ErrorCategory[] = [
      'wrong-key',
      'missing',
      'extra',
      'transposition',
      'repeated-word',
      'punctuation',
      'capitalization',
      'number',
      'space',
      'slow',
    ]
    for (const c of categories) {
      expect(ERROR_CATEGORY_LABEL[c]).toBeTruthy()
    }
  })
})
