import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Users, ClipboardList, LogOut, Menu, X, UserCheck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/clients', icon: Building2, label: 'Clients' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/consultants', icon: UserCheck, label: 'Consultants' },
  { to: '/admin/audit', icon: ClipboardList, label: 'Audit log' },
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
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <img src="/logo-white.png" alt="Tide Events Group" style={{ height: 28, width: 'auto' }} />
          {onClose && (
            <button onClick={onClose} className="text-white/50 hover:text-white tap-target">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" role="navigation" aria-label="Main navigation">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors bg-teal text-white cursor-pointer'
                : 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-white/60 hover:bg-white/8 hover:text-white cursor-pointer'
            }
          >
            <item.icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {user?.name?.[0] ?? user?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-medium truncate">{user?.name ?? 'Admin'}</div>
            <div className="text-white/40 text-2xs truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors w-full py-1"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F0F0F0' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 z-10">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-navy border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-white tap-target -ml-2"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <img src="/logo-white.png" alt="Tide Events Group" style={{ height: 24, width: 'auto' }} />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
