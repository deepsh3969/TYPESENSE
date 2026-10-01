import { QWERTY_ROWS, keyIdForChar, type KeyboardKey } from '@/data/keyboard'
import { cn } from '@/lib/utils'

const FINGER_BG: Record<string, string> = {
  lPinky: 'bg-indigo-500/15',
  lRing: 'bg-sky-500/15',
  lMiddle: 'bg-emerald-500/15',
  lIndex: 'bg-amber-500/15',
  rIndex: 'bg-rose-500/15',
  rMiddle: 'bg-violet-500/15',
  rRing: 'bg-cyan-500/15',
  rPinky: 'bg-fuchsia-500/15',
  thumb: 'bg-slate-400/15',
  none: '',
}

/** row indent in key units — modifier keys now carry the stagger inline */
const ROW_OFFSET = [0, 0, 0, 0, 0]

const MODIFIER_IDS = new Set([
  'backspace',
  'tab',
  'caps',
  'enter',
  'shift-left',
  'shift-right',
  'ctrl-left',
  'ctrl-right',
  'alt-left',
  'alt-right',
  'meta',
])

export interface KeyboardProps {
  lastKey?: { char: string; correct: boolean } | null
  /** physical key id → accuracy (0-100) for heat highlighting */
  heat?: ReadonlyMap<string, number>
  /** physical key ids to outline (drill targets) */
  highlight?: readonly string[]
  showFingers?: boolean
  onKeyClick?: (keyId: string) => void
  size?: 'sm' | 'md'
  className?: string
}

function heatClass(accuracy: number | undefined): string {
  if (accuracy === undefined) return ''
  if (accuracy >= 97) return ''
  if (accuracy >= 93) return 'border-warning/60 text-warning'
  return 'border-danger/70 text-danger'
}

export function Keyboard({
  lastKey,
  heat,
  highlight,
  showFingers,
  onKeyClick,
  size = 'md',
  className,
}: KeyboardProps) {
  const pressedId = lastKey ? keyIdForChar(lastKey.char) : null
  const pressedCorrect = lastKey?.correct ?? true
  const responsive = size === 'md'
  const unitStyle = responsive
    ? { ['--k' as string]: 'clamp(22px, 3.3vw, 44px)' }
    : { ['--k' as string]: '28px' }

  return (
    <div
      className={cn('w-full overflow-x-auto pb-1 scrollbar-thin', className)}
      role="group"
      aria-label="On-screen keyboard"
    >
      <div className="flex w-max flex-col gap-1" style={unitStyle}>
        {QWERTY_ROWS.map((row, ri) => (
          <div
            key={ri}
            className="flex gap-1"
            style={{ paddingLeft: `calc(${ROW_OFFSET[ri]} * var(--k) + ${ROW_OFFSET[ri] * 4}px)` }}
          >
            {row.map((key) => (
              <KeyCap
                key={key.id}
                keyDef={key}
                pressed={pressedId === key.id}
                pressedCorrect={pressedCorrect}
                heat={heat?.get(key.id)}
                highlighted={highlight?.includes(key.id) ?? false}
                fingerBg={showFingers ? FINGER_BG[key.finger] : undefined}
                onKeyClick={onKeyClick}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function KeyCap({
  keyDef,
  pressed,
  pressedCorrect,
  heat,
  highlighted,
  fingerBg,
  onKeyClick,
}: {
  keyDef: KeyboardKey
  pressed: boolean
  pressedCorrect: boolean
  heat?: number
  highlighted: boolean
  fingerBg?: string
  onKeyClick?: (keyId: string) => void
}) {
  const isSpace = keyDef.id === 'space'
  const isModifier = MODIFIER_IDS.has(keyDef.id)
  const style = {
    width: `calc(${keyDef.w} * var(--k) + ${(keyDef.w - 1) * 4}px)`,
    height: 'calc(var(--k) * 0.92)',
  }

  const classes = cn(
    'flex items-center justify-center rounded-[3px] border text-[10px] font-bold uppercase tracking-[0.05em] transition-all duration-75 select-none',
    isModifier && 'text-ink-faint',
    fingerBg,
    heatClass(heat),
    highlighted && 'border-primary ring-1 ring-primary',
    pressed
      ? pressedCorrect
        ? 'scale-[0.97] border-success bg-success/25 text-success'
        : 'scale-[0.97] border-danger bg-danger text-white'
      : 'border-line bg-surface-2 hover:border-primary/50 hover:text-ink',
  )

  const content = isSpace ? '' : keyDef.label

  if (onKeyClick && !isSpace && !isModifier) {
    return (
      <button
        type="button"
        style={style}
        className={classes}
        aria-label={keyDef.label}
        onClick={() => onKeyClick(keyDef.id)}
      >
        {content}
      </button>
    )
  }
  return (
    <span style={style} className={classes} aria-hidden={!isSpace ? undefined : true}>
      {content}
    </span>
  )
}
