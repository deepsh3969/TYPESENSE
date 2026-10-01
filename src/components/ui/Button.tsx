import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'accent'
type Size = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-[0_6px_16px_-6px_color-mix(in_srgb,var(--brand)_70%,transparent)] hover:bg-primary-strong active:translate-y-px',
  accent: 'bg-accent text-white hover:brightness-110 active:translate-y-px',
  secondary: 'bg-surface-2 text-ink border border-line hover:border-primary/40 hover:text-primary',
  ghost: 'text-ink-muted hover:bg-surface-2 hover:text-ink',
  outline: 'border border-line bg-transparent text-ink hover:border-primary/50 hover:text-primary',
  danger: 'bg-danger text-white hover:brightness-110 active:translate-y-px',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-10 w-10 justify-center',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-xl font-semibold transition-all duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
})

const sharedClasses =
  'inline-flex select-none items-center justify-center rounded-xl font-semibold transition-all duration-150 active:translate-y-px'

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={cn(sharedClasses, variants[variant], sizes[size], className)} {...props} />
}
