import { useId, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

export function Tabs({
  items,
  defaultValue,
  value,
  onChange,
  className,
  listClassName,
}: {
  items: TabItem[]
  defaultValue?: string
  value?: string
  onChange?: (id: string) => void
  className?: string
  listClassName?: string
}) {
  const autoId = useId()
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id)
  const active = value ?? internal
  const reduced = useReducedMotion()

  const select = (id: string) => {
    if (value === undefined) setInternal(id)
    onChange?.(id)
  }

  const activeItem = items.find((i) => i.id === active) ?? items[0]

  return (
    <div className={className}>
      <div
        role="tablist"
        className={cn('inline-flex flex-wrap items-center gap-1 rounded-xl border border-line bg-surface-2 p-1', listClassName)}
      >
        {items.map((item) => {
          const selected = item.id === activeItem?.id
          return (
            <button
              key={item.id}
              role="tab"
              id={`${autoId}-${item.id}-tab`}
              aria-selected={selected}
              aria-controls={`${autoId}-${item.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault()
                  const idx = items.findIndex((i) => i.id === active)
                  const next = e.key === 'ArrowRight' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length
                  select(items[next].id)
                  document.getElementById(`${autoId}-${items[next].id}-tab`)?.focus()
                }
              }}
              className={cn(
                'relative rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors',
                selected ? 'text-white' : 'text-ink-muted hover:text-ink',
              )}
            >
              {selected && (
                <motion.span
                  layoutId={`${autoId}-active`}
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                {item.icon}
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
      {activeItem && (
        <div role="tabpanel" id={`${autoId}-${activeItem.id}-panel`} aria-labelledby={`${autoId}-${activeItem.id}-tab`} className="mt-4">
          {activeItem.content}
        </div>
      )}
    </div>
  )
}
