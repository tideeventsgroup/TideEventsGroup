import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Calendar, FileText, AlertTriangle, Users, Map, FolderOpen,
  BarChart2, LogOut, ChevronLeft, Layers, ClipboardList
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ROLE_LABELS } from '../../types'
import { TideLogo } from '../ui/TideLogo'

export function PlanningLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { to: '/planning', label: 'Overview', icon: Layers, end: true },
    { to: '/planning/events', label: 'Events', icon: Calendar },
    { to: '/planning/risks', label: 'Risk Register', icon: AlertTriangle },
    { to: '/planning/resources', label: 'Resources', icon: Users },
    { to: '/planning/schedule', label: 'Staff Schedule', icon: ClipboardList },
    { to: '/planning/documents', label: 'Documents', icon: FolderOpen },
    { to: '/planning/site-map', label: 'Site Mapping', icon: Map },
    { to: '/planning/reports', label: 'Reports', icon: BarChart2 },
  ]

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#F2F3F7' }}>

      {/* Sidebar */}
      <aside className="flex flex-col flex-shrink-0"
        style={{ width: 220, background: '#0F1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo + mode */}
        <div className="px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <TideLogo variant="full-white" height={28} />
          <div className="mt-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: '#5B8CFF' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#5B8CFF' }}>
              Planning Mode
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive ? { background: 'rgba(91,140,255,0.12)', color: '#5B8CFF' } : {}}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => navigate('/mode-select')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all mb-1"
          >
            <ChevronLeft size={13} /> Switch Mode
          </button>
          <div className="flex items-center justify-between px-3 py-2">
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-white/30 text-xs truncate">{ROLE_LABELS[user?.role ?? 'event_manager']}</p>
            </div>
            <button onClick={signOut} className="text-white/30 hover:text-white/70 transition-colors ml-2 flex-shrink-0">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>

    </div>
  )
}
