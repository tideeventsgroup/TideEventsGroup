import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Users, Truck, LogOut, Menu, X, CheckSquare, Calendar, ClipboardList, Radio } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { TideMark } from '../ui/TideLogo'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/client', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/client/live', icon: Radio, label: 'Live Dashboard' },
  { to: '/client/events', icon: Calendar, label: 'Events' },
  { to: '/client/documents', icon: FileText, label: 'Documents' },
  { to: '/client/staff', icon: Users, label: 'Staff' },
  { to: '/client/contractors', icon: Truck, label: 'Contractors' },
  { to: '/client/compliance', icon: CheckSquare, label: "Martyn's Law" },
]

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full bg-navy" style={{ width: 256 }}>
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <TideMark size={28} />
          <div>
            <div className="text-white font-semibold text-sm leading-tight">Tide IMS</div>
            <div className="text-white/40 text-xs">Client portal</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white tap-target">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5" role="navigation">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn('nav-item', isActive ? 'nav-item-active' : 'nav-item-inactive')
            }
          >
            <item.icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {user?.name?.[0] ?? user?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-medium truncate">{user?.name ?? 'Client admin'}</div>
            <div className="text-white/40 text-2xs truncate">{user?.email}</div>
          </div>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors w-full py-1">
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  )
}

export function ClientLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 z-10">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-navy border-b border-white/10 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-white tap-target -ml-2" aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <TideMark size={22} />
            <span className="text-white font-semibold text-sm">Tide IMS</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-content mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
