import { Outlet, NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, CalendarDays, Users, BarChart3,
  FileText, Table2, ChevronRight, LogOut, User, GripVertical, Menu, ChevronLeft
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/dashboard',       label: 'Dashboard',              icon: LayoutDashboard },
  { to: '/daily-grid',      label: 'Daily Grid (Client)',   icon: CalendarDays    },
  { to: '/daily-grid-associate', label: 'Daily Grid (Associate)',icon: Users           },
  { to: '/monthly-summary', label: 'Monthly Team Summary',   icon: BarChart3       },
  { to: '/sourcer-report',  label: 'Sourcer Report',         icon: FileText        },
  { to: '/submissions',     label: 'All Submissions',        icon: Table2          },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={cn(
        'h-full flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 relative',
        sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
      )}>
        {/* Handle bar to collapse */}
        {sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-l-lg flex items-center justify-center shadow-md hover:shadow-lg transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
        )}
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
        
        {/* User Info & Logout */}
        <div className="px-4 py-3 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt={user.name} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
          <p className="text-xs text-slate-500 text-center">Built by <span className="glow-text uppercase font-bold">Automations Team</span></p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header with toggle button (only shows when sidebar is closed) */}
        <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
          {!sidebarOpen && (
            <>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-md hover:shadow-lg"
                >
                  <Menu className="w-6 h-6" />
                </button>
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
              {/* User Info & Logout */}
              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-3">
                  {user?.picture ? (
                    <img 
                      src={user.picture} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-slate-200 truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            </>
          )}
        </header>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
