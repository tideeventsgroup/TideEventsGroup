import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BookOpen, Map, Phone, List, Waves } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function AppHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const eventName = localStorage.getItem('tide_event_name') ?? 'Your event'
  const isSupervisor = user?.role === 'tide_consultant' || user?.role === 'super_admin' || user?.role === 'client_admin'

  const mainActions = [
    { label: 'Log incident', icon: AlertTriangle, to: '/app/log-incident', bg: 'bg-teal', iconColor: 'text-white' },
    { label: 'My briefing', icon: BookOpen, to: '/app/briefing', bg: 'bg-navy', iconColor: 'text-white' },
    { label: 'Site map', icon: Map, to: '/app/site-map', bg: 'bg-navy', iconColor: 'text-white' },
    { label: 'Emergency contacts', icon: Phone, to: '/app/emergency', bg: 'bg-navy', iconColor: 'text-white' },
  ]

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-6 pb-2">
        <div className="text-xs text-gray-400">
          {user?.name ?? user?.email}<br />
          <span className="text-gray-300">{user?.role?.replace(/_/g, ' ')}</span>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-navy">{eventName}</div>
          <div className="text-xs text-gray-400">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="h-20 w-20 rounded-2xl bg-navy flex items-center justify-center mb-3">
          <Waves size={40} className="text-teal" />
        </div>
        <h1 className="text-xl font-semibold text-navy">Tide IMS</h1>
        <p className="text-xs text-gray-400 mt-1">Incident management system</p>
      </div>

      {/* Main action grid */}
      <div className="px-4 grid grid-cols-2 gap-3 flex-1">
        {mainActions.map(action => (
          <button
            key={action.to}
            onClick={() => navigate(action.to)}
            className={`${action.bg} rounded-xl p-6 flex flex-col items-center justify-center gap-3 min-h-[120px] active:opacity-80 transition-opacity`}
            style={{ minHeight: '120px' }}
          >
            <action.icon size={32} className={action.iconColor} />
            <span className="text-sm font-medium text-white text-center leading-tight">{action.label}</span>
          </button>
        ))}
      </div>

      {/* View incidents — supervisor only */}
      {isSupervisor && (
        <div className="px-4 pb-6 pt-3">
          <button
            onClick={() => navigate('/app/incidents')}
            className="w-full flex items-center justify-center gap-2 py-4 border border-navy/30 rounded-xl text-navy text-sm font-medium hover:bg-navy/5 active:bg-navy/10 transition-colors"
          >
            <List size={18} />
            View incidents
          </button>
        </div>
      )}

      <div className="h-6" />
    </div>
  )
}
