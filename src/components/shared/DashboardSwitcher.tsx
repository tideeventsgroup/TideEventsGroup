import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Radio } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface SwitcherOption {
  label: string
  path: string
  icon: React.ElementType
  roles: string[]
}

const OPTIONS: SwitcherOption[] = [
  { label: 'Admin',  path: '/admin',       icon: LayoutDashboard, roles: ['super_admin'] },
  { label: 'Client', path: '/client',      icon: Users,           roles: ['super_admin', 'client_admin', 'tide_consultant'] },
  { label: 'Live',   path: '/client/live', icon: Radio,           roles: ['super_admin', 'client_admin', 'tide_consultant'] },
]

export function DashboardSwitcher() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  if (!user) return null

  const visible = OPTIONS.filter(o => o.roles.includes(user.role))
  if (visible.length < 2) return null

  return (
    <div className="mx-3 mb-3 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div className="flex">
        {visible.map(opt => {
          const active = location.pathname.startsWith(opt.path) &&
            (opt.path === '/client/live' ? location.pathname.startsWith('/client/live') :
             opt.path === '/client'       ? !location.pathname.startsWith('/client/live') : true)
          return (
            <button
              key={opt.path}
              onClick={() => navigate(opt.path)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg transition-all"
              style={{
                background: active ? 'rgba(232,82,26,0.9)' : 'transparent',
                color: active ? 'white' : 'rgba(255,255,255,0.4)',
              }}
            >
              <opt.icon size={14} color={active ? 'white' : 'rgba(255,255,255,0.4)'} />
              <span style={{ fontSize: 10, fontWeight: 600 }}>{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
