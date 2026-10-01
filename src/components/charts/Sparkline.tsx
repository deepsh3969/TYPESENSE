import { accuracyToPercent } from '@/lib/accuracy'
import type { DailyPoint } from '@/analytics/summarize'

/**
 * Dependency-free SVG trend preview used on the landing page so recharts
 * stays out of the critical first-paint bundle.
 */
export function Sparkline({ data, height = 200 }: { data: DailyPoint[]; height?: number }) {
  const pts = data.filter((d) => d.wpm != null)
  if (pts.length < 2) return null

  const w = 640
  const h = height
  const padX = 10
  const padY = 16

  const wpmValues = pts.map((d) => d.wpm as number)
  const minWpm = Math.min(...wpmValues)
  const maxWpm = Math.max(...wpmValues)
  const spanWpm = maxWpm - minWpm || 1

  const accValues = pts.map((d) => d.accuracy ?? 0)
  const minAcc = Math.min(...accValues)
  const maxAcc = Math.max(...accValues)
  const spanAcc = maxAcc - minAcc || 1

  const px = (i: number) => padX + (i / (pts.length - 1)) * (w - padX * 2)
  const pyWpm = (v: number) => h - padY - ((v - minWpm) / spanWpm) * (h - padY * 2)
  const pyAcc = (v: number) => h - padY - ((v - minAcc) / spanAcc) * (h - padY * 2)

  const wpmLine = pts.map((d, i) => `${px(i).toFixed(1)},${pyWpm(d.wpm as number).toFixed(1)}`).join(' ')
  const accLine = pts.map((d, i) => `${px(i).toFixed(1)},${pyAcc(d.accuracy ?? 0).toFixed(1)}`).join(' ')
  const area = `M ${px(0).toFixed(1)},${h - padY} L ${wpmLine.split(' ').join(' L ')} L ${px(pts.length - 1).toFixed(1)},${h - padY} Z`

  return (
    <figure className="w-full" aria-hidden>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        style={{ height }}
        role="presentation"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={w - padX}
            y1={padY + (h - padY * 2) * f}
            y2={padY + (h - padY * 2) * f}
            className="stroke-line"
            strokeWidth={1}
          />
        ))}
        <path d={area} fill="url(#spark-fill)" />
        <polyline
          points={wpmLine}
          fill="none"
          className="stroke-primary"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={accLine}
          fill="none"
          className="stroke-success"
          strokeWidth={2}
          strokeDasharray="5 5"
          strokeLinecap="round"
        />
      </svg>
      <figcaption className="mt-3 flex items-center justify-between text-[11px] font-medium text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-primary" /> WPM {minWpm}–{maxWpm}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-success" /> Accuracy {accuracyToPercent(minAcc, 0)}–
          {accuracyToPercent(maxAcc, 0)}%
        </span>
        <span>{pts.length} days</span>
      </figcaption>
    </figure>
  )
}
