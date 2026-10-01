import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/** Accessible tooltip: shows on hover AND keyboard focus, dismissible with Escape. */
export function Tooltip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}) {
  const [open, setOpen] = useState(false)

  const position =
    side === 'top'
      ? 'bottom-full left-1/2 mb-2 -translate-x-1/2'
      : side === 'bottom'
        ? 'top-full left-1/2 mt-2 -translate-x-1/2'
        : side === 'left'
          ? 'right-full top-1/2 mr-2 -translate-y-1/2'
          : 'left-full top-1/2 ml-2 -translate-y-1/2'

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            className={cn(
              'pointer-events-none absolute z-40 w-max max-w-[240px] rounded-[3px] bg-ink px-2.5 py-1.5 text-xs font-medium text-white shadow-lg',
              position,
            )}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
