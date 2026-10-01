import { NavLink } from 'react-router-dom'
import { mobileNav } from '@/lib/nav'
import { cn } from '@/lib/utils'

export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Mobile"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {mobileNav.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-bold tracking-[0.06em] uppercase transition-colors',
                  isActive
                    ? 'text-primary before:absolute before:top-0 before:h-[3px] before:w-10 before:bg-primary before:content-[""]'
                    : 'text-ink-faint',
                )
              }
            >
              <span
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-[3px] transition-colors',
                  '[[aria-current=page]_&]:bg-primary/10',
                )}
              >
                <item.icon className="size-5" aria-hidden />
              </span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
