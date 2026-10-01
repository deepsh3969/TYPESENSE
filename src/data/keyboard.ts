export type Finger =
  | 'lPinky'
  | 'lRing'
  | 'lMiddle'
  | 'lIndex'
  | 'rIndex'
  | 'rMiddle'
  | 'rRing'
  | 'rPinky'
  | 'thumb'
  | 'none'

export interface KeyboardKey {
  /** physical key id: lowercase letters, digit, or punctuation */
  id: string
  label: string
  /** character produced with shift, when different */
  shiftLabel?: string
  finger: Finger
  row: 0 | 1 | 2 | 3 | 4
  /** width in key units */
  w: number
}

export const FINGER_INFO: Record<Finger, { name: string; hand: 'Left' | 'Right' | 'Both'; className: string }> = {
  lPinky: { name: 'Left pinky', hand: 'Left', className: 'fill-indigo-500/70' },
  lRing: { name: 'Left ring', hand: 'Left', className: 'fill-sky-500/70' },
  lMiddle: { name: 'Left middle', hand: 'Left', className: 'fill-emerald-500/70' },
  lIndex: { name: 'Left index', hand: 'Left', className: 'fill-amber-500/70' },
  rIndex: { name: 'Right index', hand: 'Right', className: 'fill-rose-500/70' },
  rMiddle: { name: 'Right middle', hand: 'Right', className: 'fill-violet-500/70' },
  rRing: { name: 'Right ring', hand: 'Right', className: 'fill-cyan-500/70' },
  rPinky: { name: 'Right pinky', hand: 'Right', className: 'fill-fuchsia-500/70' },
  thumb: { name: 'Thumb', hand: 'Both', className: 'fill-slate-400/70' },
  none: { name: '—', hand: 'Both', className: 'fill-slate-300/70' },
}

const k = (id: string, finger: Finger, row: KeyboardKey['row'], w = 1, label = id, shiftLabel?: string): KeyboardKey => ({
  id,
  label,
  shiftLabel,
  finger,
  row,
  w,
})

export const QWERTY_ROWS: KeyboardKey[][] = [
  // row 0 — numbers
  [
    k('`', 'lPinky', 0, 1, '`', '~'),
    k('1', 'lPinky', 0, 1, '1', '!'),
    k('2', 'lRing', 0, 1, '2', '@'),
    k('3', 'lMiddle', 0, 1, '3', '#'),
    k('4', 'lIndex', 0, 1, '4', '$'),
    k('5', 'lIndex', 0, 1, '5', '%'),
    k('6', 'rIndex', 0, 1, '6', '^'),
    k('7', 'rIndex', 0, 1, '7', '&'),
    k('8', 'rMiddle', 0, 1, '8', '*'),
    k('9', 'rRing', 0, 1, '9', '('),
    k('0', 'rPinky', 0, 1, '0', ')'),
    k('-', 'rPinky', 0, 1, '-', '_'),
    k('=', 'rPinky', 0, 1, '=', '+'),
  ],
  // row 1 — qwerty
  [
    k('q', 'lPinky', 1),
    k('w', 'lRing', 1),
    k('e', 'lMiddle', 1),
    k('r', 'lIndex', 1),
    k('t', 'lIndex', 1),
    k('y', 'rIndex', 1),
    k('u', 'rIndex', 1),
    k('i', 'rMiddle', 1),
    k('o', 'rRing', 1),
    k('p', 'rPinky', 1),
    k('[', 'rPinky', 1, 1, '[', '{'),
    k(']', 'rPinky', 1, 1, ']', '}'),
  ],
  // row 2 — home
  [
    k('a', 'lPinky', 2),
    k('s', 'lRing', 2),
    k('d', 'lMiddle', 2),
    k('f', 'lIndex', 2),
    k('g', 'lIndex', 2),
    k('h', 'rIndex', 2),
    k('j', 'rIndex', 2),
    k('k', 'rMiddle', 2),
    k('l', 'rRing', 2),
    k(';', 'rPinky', 2, 1, ';', ':'),
    k("'", 'rPinky', 2, 1, "'", '"'),
  ],
  // row 3 — bottom
  [
    k('z', 'lPinky', 3),
    k('x', 'lRing', 3),
    k('c', 'lMiddle', 3),
    k('v', 'lIndex', 3),
    k('b', 'lIndex', 3),
    k('n', 'rIndex', 3),
    k('m', 'rIndex', 3),
    k(',', 'rMiddle', 3, 1, ',', '<'),
    k('.', 'rRing', 3, 1, '.', '>'),
    k('/', 'rPinky', 3, 1, '/', '?'),
  ],
  // row 4 — space
  [k('space', 'thumb', 4, 10, 'space')],
]

export const KEY_INDEX: ReadonlyMap<string, KeyboardKey> = new Map(
  QWERTY_ROWS.flat().map((key) => [key.id, key]),
)

const SHIFTED_TO_BASE: Record<string, string> = {
  '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5',
  '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=',
  '{': '[', '}': ']', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/',
}

/** Maps any typed character (incl. uppercase/shifted) to its physical key. */
export function keyIdForChar(char: string): string | null {
  if (char === ' ') return 'space'
  const lower = char.toLowerCase()
  if (KEY_INDEX.has(lower)) return lower
  const base = SHIFTED_TO_BASE[char]
  if (base && KEY_INDEX.has(base)) return base
  return null
}

/** Finger zone for any typed character. */
export function fingerForChar(char: string): Finger {
  const id = keyIdForChar(char)
  if (!id) return 'none'
  return KEY_INDEX.get(id)?.finger ?? 'none'
}
