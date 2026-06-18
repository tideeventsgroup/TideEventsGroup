import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Users, ClipboardList, LogOut, Menu, X, UserCheck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/admin',             icon: LayoutDashboard, label: 'Dashboard',   end: true },
  { to: '/admin/clients',     icon: Building2,       label: 'Clients' },
  { to: '/admin/users',       icon: Users,           label: 'Users' },
  { to: '/admin/consultants', icon: UserCheck,       label: 'Consultants' },
  { to: '/admin/audit',       icon: ClipboardList,   label: 'Audit log' },
]

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full" style={{ width: 240, background: '#111111' }}>
      {/* Brand */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between">
          <img src="/logo-white.png" alt="Tide Events Group" style={{ height: 26, width: 'auto' }} />
          {onClose && (
            <button onClick={onClose} className="tap-target" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="mt-4 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(232,82,26,0.1)', border: '1px solid rgba(232,82,26,0.15)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#E8521A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin Console</p>
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
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'hover:text-white cursor-pointer'
              }`
            }
            style={({ isActive }) => isActive
              ? { background: '#E8521A', color: 'white' }
              : { color: 'rgba(255,255,255,0.45)' }
            }
          >
            {({ isActive: _isActive }) => (
              <>
                <item.icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center rounded-xl font-bold text-sm flex-shrink-0"
            style={{ background: 'rgba(232,82,26,0.15)', color: '#E8521A', height: 34, width: 34 }}
          >
            {user?.name?.[0] ?? user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>{user?.name ?? 'Admin'}</div>
            <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)' }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F2F3F7' }}>
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 z-10">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="lg:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: '#111111', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <button onClick={() => setMobileOpen(true)} className="text-white tap-target -ml-2" aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <img src="/logo-white.png" alt="Tide Events Group" style={{ height: 22, width: 'auto' }} />
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
