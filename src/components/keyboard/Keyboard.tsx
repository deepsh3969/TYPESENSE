import { QWERTY_ROWS, keyIdForChar, type KeyboardKey } from '@/data/keyboard'
import { cn } from '@/lib/utils'

const FINGER_BG: Record<string, string> = {
  lPinky: 'bg-indigo-500/20',
  lRing: 'bg-sky-500/20',
  lMiddle: 'bg-emerald-500/20',
  lIndex: 'bg-amber-500/20',
  rIndex: 'bg-rose-500/20',
  rMiddle: 'bg-violet-500/20',
  rRing: 'bg-cyan-500/20',
  rPinky: 'bg-fuchsia-500/20',
  thumb: 'bg-slate-400/20',
  none: '',
}

/** row indent in key units — classic stagger */
const ROW_OFFSET = [0, 0.35, 0.7, 1.15, 3.5]

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
  if (accuracy >= 93) return 'bg-warning/40 border-warning/50'
  return 'bg-danger/45 border-danger/60'
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
  const unit = size === 'sm' ? 30 : 38

  return (
    <div
      className={cn('inline-block max-w-full overflow-x-auto pb-1', className)}
      role="group"
      aria-label="On-screen keyboard"
    >
      <div className="flex flex-col gap-1" style={{ ['--k' as string]: `${unit}px` }}>
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
                unit={unit}
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
  unit,
}: {
  keyDef: KeyboardKey
  pressed: boolean
  pressedCorrect: boolean
  heat?: number
  highlighted: boolean
  fingerBg?: string
  onKeyClick?: (keyId: string) => void
  unit: number
}) {
  const isSpace = keyDef.id === 'space'
  const style = {
    width: `calc(${keyDef.w} * var(--k) + ${(keyDef.w - 1) * 4}px)`,
    height: unit * 0.92,
  }

  const classes = cn(
    'flex items-center justify-center rounded-lg border text-[11px] font-bold uppercase transition-all duration-75 select-none',
    fingerBg,
    heatClass(heat),
    highlighted && 'ring-2 ring-primary ring-offset-1 ring-offset-bg',
    pressed
      ? pressedCorrect
        ? 'scale-95 border-primary bg-primary text-white shadow-inner'
        : 'scale-95 border-danger bg-danger text-white shadow-inner'
      : 'border-line bg-surface-2 text-ink-muted hover:border-primary/40 hover:text-ink',
  )

  const content = isSpace ? '' : keyDef.label

  if (onKeyClick && !isSpace) {
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
