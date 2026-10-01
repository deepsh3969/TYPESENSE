import { NavLink } from 'react-router-dom'
import { KeyboardIcon, PanelLeftClose, PanelLeftOpen, Zap } from 'lucide-react'
import { mainNav } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'
import { levelFromXp } from '@/gamification/levels'

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)
  const xp = useUserStore((s) => s.data.profile.xp)
  const level = levelFromXp(xp)

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[76px]' : 'w-64',
      )}
      aria-label="Primary"
    >
      {/* logo */}
      <div className={cn('flex h-16 items-center gap-3 border-b border-line px-4', collapsed && 'justify-center px-0')}>
        <span className="flex size-9 shrink-0 items-center justify-center bg-primary text-white">
          <KeyboardIcon className="size-5" aria-hidden />
        </span>
        {!collapsed && (
          <span className="font-display text-base font-bold tracking-tight">
            TYPE<span className="text-primary">SENSE</span>
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {mainNav.map((group, gi) => (
          <div key={group.label ?? gi} className="mb-5">
            {group.label && !collapsed && <p className="label mb-2 px-3">{group.label}</p>}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center gap-3 rounded-[3px] px-3 py-2.5 text-sm font-semibold transition-colors',
                        isActive
                          ? 'bg-primary/10 text-ink before:absolute before:top-1/2 before:-left-3 before:h-5 before:w-[3px] before:-translate-y-1/2 before:bg-primary before:content-[""]'
                          : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
                        collapsed && 'justify-center px-0',
                      )
                    }
                  >
                    <item.icon className="size-[18px] shrink-0" aria-hidden />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* level card */}
      <div className={cn('border-t border-line p-3', collapsed && 'px-2')}>
        <div
          className={cn('border border-line bg-surface-2 p-3', collapsed && 'flex justify-center p-2')}
        >
          {collapsed ? (
            <Zap className="size-4 text-primary" aria-hidden />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="label">Level {level.level}</span>
                <span className="num text-xs font-bold text-ink">{level.toNext} XP</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden bg-white/10">
                <div
                  className="h-full bg-primary transition-[width] duration-700"
                  style={{ width: `${level.progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-ink-muted">{level.title}</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={toggle}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <><PanelLeftClose className="size-4" /> Collapse</>}
        </button>
      </div>
    </aside>
  )
}
