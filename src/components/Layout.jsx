import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Users, BarChart3,
  FileText, Table2, ChevronRight
} from 'lucide-react'
import { cn } from '../lib/utils'

const NAV = [
  { to: '/dashboard',       label: 'Dashboard',              icon: LayoutDashboard },
  { to: '/daily-grid',      label: 'Daily Grid (Client)',   icon: CalendarDays    },
  { to: '/weekly-grid',     label: 'Weekly Grid (Associate)',icon: Users           },
  { to: '/monthly-summary', label: 'Monthly Team Summary',   icon: BarChart3       },
  { to: '/sourcer-report',  label: 'Sourcer Report',         icon: FileText        },
  { to: '/submissions',     label: 'All Submissions',        icon: Table2          },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100 leading-tight font-orbitron uppercase tracking-wide">Deal Sourcing Form</p>
              <p className="text-xs glow-text font-medium uppercase">Report Dashboard</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-slate-800'
                  : 'text-slate-300 hover:bg-slate-800'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    className={cn('w-4 h-4 flex-shrink-0', isActive ? '' : 'text-slate-500 group-hover:text-slate-300')} 
                    style={isActive ? { color: 'rgb(129, 140, 248)' } : {}}
                  />
                  <span className="flex-1 font-orbitron text-xs uppercase tracking-wider group-hover:text-slate-100" style={isActive ? { color: 'rgb(129, 140, 248)' } : {}}>{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3" style={{ color: 'rgb(129, 140, 248)' }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-slate-800">
          <p className="text-xs text-slate-500">Built by <span className="glow-text uppercase font-bold">Automations Team</span></p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
