import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-lg bg-surface-2', className)}
      aria-hidden
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-line/60 to-transparent"
        style={{ animationDirection: 'ltr' }}
      />
    </div>
  )
}
