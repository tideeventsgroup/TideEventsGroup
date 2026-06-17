import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Users, Truck, LogOut, Menu, CheckSquare, Calendar } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/client', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/client/events', icon: Calendar, label: 'Events' },
  { to: '/client/documents', icon: FileText, label: 'Documents' },
  { to: '/client/staff', icon: Users, label: 'Staff' },
  { to: '/client/contractors', icon: Truck, label: 'Contractors' },
  { to: '/client/compliance', icon: CheckSquare, label: "Martyn's Law" },
]

export function ClientLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-navy text-white w-64">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="text-lg font-semibold tracking-tight">Tide IMS</div>
        <div className="text-xs text-white/50 mt-0.5">Client portal</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn('flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors',
                isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white')
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-xs text-white/50 mb-1 truncate">{user?.name ?? user?.email}</div>
        <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <div className="hidden md:flex flex-col flex-shrink-0">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 z-50">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-navy text-white">
          <button onClick={() => setMobileOpen(true)} className="p-1"><Menu size={20} /></button>
          <span className="font-semibold text-sm">Tide IMS</span>
          <div className="w-6" />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
