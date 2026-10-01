import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyPoint } from '@/analytics/summarize'
import type { WpmSample } from '@/types/typing'

const COLORS = {
  primary: '#6366f1',
  accent: '#06b6d4',
  grid: '#94a3b8',
  success: '#22c55e',
  danger: '#f87171',
}

const axisProps = {
  stroke: COLORS.grid,
  strokeOpacity: 0.4,
  tick: { fill: COLORS.grid, fontSize: 11 },
  tickLine: false as const,
  axisLine: false as const,
}

function ChartCard({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div role="img" aria-label={label} className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

function chartTooltipFormatter(value: unknown, name?: unknown): [React.ReactNode, React.ReactNode] {
  const v = typeof value === 'number' ? Math.round(value * 10) / 10 : String(value)
  return [v, name == null ? '' : String(name)]
}

export function TrendChart({ data }: { data: DailyPoint[] }) {
  const rows = data.map((d) => ({ ...d, label: d.date.slice(5) }))
  return (
    <ChartCard label="Daily words per minute trend">
      <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke={COLORS.grid} strokeOpacity={0.15} vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
        <YAxis {...axisProps} width={44} domain={[0, 'auto']} />
        <Tooltip
          contentStyle={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            fontSize: 12,
            color: 'var(--ink)',
          }}
          formatter={chartTooltipFormatter}
          labelStyle={{ color: 'var(--ink-faint)' }}
        />
        <Line
          type="monotone"
          dataKey="wpm"
          name="WPM"
          stroke={COLORS.primary}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: COLORS.primary }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="accuracy"
          name="Accuracy %"
          stroke={COLORS.accent}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: COLORS.accent }}
          strokeDasharray="5 4"
          connectNulls
        />
      </LineChart>
    </ChartCard>
  )
}

export function MinutesBars({ data }: { data: DailyPoint[] }) {
  const rows = data.map((d) => ({ ...d, label: d.date.slice(5) }))
  return (
    <ChartCard label="Minutes practiced per day">
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke={COLORS.grid} strokeOpacity={0.15} vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
        <YAxis {...axisProps} width={44} />
        <Tooltip
          contentStyle={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            fontSize: 12,
            color: 'var(--ink)',
          }}
          formatter={chartTooltipFormatter}
          labelStyle={{ color: 'var(--ink-faint)' }}
        />
        <Bar dataKey="minutes" name="Minutes" fill={COLORS.accent} radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ChartCard>
  )
}

export function TimelineChart({ samples, fallbackWpm }: { samples: WpmSample[]; fallbackWpm: number }) {
  const rows =
    samples.length > 0
      ? samples
      : [
          { t: 0, wpm: fallbackWpm, accuracy: 100 },
          { t: 1, wpm: fallbackWpm, accuracy: 100 },
        ]
  return (
    <ChartCard label="Speed over the session">
      <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="wpmFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.35} />
            <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={COLORS.grid} strokeOpacity={0.15} vertical={false} />
        <XAxis dataKey="t" {...axisProps} tickFormatter={(v: number) => `${v}s`} />
        <YAxis {...axisProps} width={44} domain={[0, 'auto']} />
        <Tooltip
          contentStyle={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            fontSize: 12,
            color: 'var(--ink)',
          }}
          formatter={chartTooltipFormatter}
          labelStyle={{ color: 'var(--ink-faint)' }}
        />
        <Area
          type="monotone"
          dataKey="wpm"
          name="WPM"
          stroke={COLORS.primary}
          strokeWidth={2.5}
          fill="url(#wpmFill)"
        />
      </AreaChart>
    </ChartCard>
  )
}
