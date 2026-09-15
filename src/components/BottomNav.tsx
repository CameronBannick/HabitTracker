import { NavLink } from 'react-router-dom'
import { ClipboardList, Flame, ListChecks, Settings } from 'lucide-react'

const SL_BLUE = '#1E7FFF'

const NAV_ITEMS = [
  { to: '/',         icon: ListChecks,    label: 'Habits', end: true },
  { to: '/tasks',    icon: ClipboardList, label: 'Tasks'             },
  { to: '/vices',    icon: Flame,         label: 'Vices'             },
  { to: '/settings', icon: Settings,      label: 'System'            },
]

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: 'rgba(3, 10, 24, 0.98)',
        borderTop: '1px solid rgba(30,127,255,0.35)',
        boxShadow: '0 -4px 24px rgba(30,127,255,0.12)',
        paddingBottom: 'var(--sab)',
      }}
    >
      <div className="flex max-w-lg mx-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex-1 min-w-0 flex flex-col items-center gap-1 py-3 transition-colors"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  color={isActive ? SL_BLUE : 'rgba(255,255,255,0.25)'}
                />
                <span
                  className="text-[10px] font-medium truncate max-w-full px-0.5"
                  style={{ color: isActive ? SL_BLUE : 'rgba(255,255,255,0.25)' }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
