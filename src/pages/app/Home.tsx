import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BookOpen, Map, Phone, List } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { TideLogo } from '../../components/ui/TideLogo'

const ACTIONS = [
  {
    label: 'Log incident',
    icon: AlertTriangle,
    to: '/app/log-incident',
    bg: 'bg-teal',
    text: 'text-white',
    description: 'Report an incident',
    primary: true,
  },
  {
    label: 'My briefing',
    icon: BookOpen,
    to: '/app/briefing',
    bg: 'bg-navy',
    text: 'text-white',
    description: 'View your role briefing',
  },
  {
    label: 'Site map',
    icon: Map,
    to: '/app/site-map',
    bg: 'bg-navy',
    text: 'text-white',
    description: 'View event site map',
  },
  {
    label: 'Emergency contacts',
    icon: Phone,
    to: '/app/emergency',
    bg: 'bg-navy',
    text: 'text-white',
    description: 'Tap to call contacts',
  },
]

export function AppHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const eventName = localStorage.getItem('tide_event_name') ?? 'Your event'
  const isSupervisor = ['tide_consultant', 'super_admin', 'client_admin'].includes(user?.role ?? '')

  const roleLabel: Record<string, string> = {
    super_admin: 'Super admin',
    client_admin: 'Event manager',
    client_staff: 'Event staff',
    tide_consultant: 'Tide consultant',
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col pb-safe">
      {/* Status bar area */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div className="text-xs text-gray-400 leading-snug">
          <span className="font-medium text-navy">{user?.name ?? 'Staff'}</span>
          <br />
          <span>{roleLabel[user?.role ?? ''] ?? 'Staff'}</span>
        </div>
        <div className="text-right text-xs text-gray-400 leading-snug">
          <span className="font-medium text-navy truncate max-w-[140px] block text-right">{eventName}</span>
          <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Brand lockup */}
      <div className="flex flex-col items-center py-8">
        <TideLogo variant="full" height={56} />
      </div>

      {/* Action grid */}
      <div className="flex-1 px-5">
        {/* Log incident — full width primary */}
        <button
          onClick={() => navigate('/app/log-incident')}
          className="w-full bg-teal rounded-xl p-5 flex items-center gap-4 mb-3 active:opacity-85 transition-opacity"
          style={{ minHeight: 72 }}
        >
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={26} className="text-white" />
          </div>
          <div className="text-left">
            <div className="text-white font-semibold text-base">Log incident</div>
            <div className="text-white/70 text-xs mt-0.5">Report a new incident</div>
          </div>
        </button>

        {/* Secondary actions — 2-col grid */}
        <div className="grid grid-cols-3 gap-3">
          {ACTIONS.slice(1).map(action => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className={`${action.bg} rounded-xl flex flex-col items-center justify-center gap-2 active:opacity-85 transition-opacity`}
              style={{ minHeight: 100 }}
            >
              <action.icon size={24} className="text-white" />
              <span className="text-white text-xs font-medium text-center leading-tight px-2">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* View incidents — supervisor only */}
      {isSupervisor && (
        <div className="px-5 py-5">
          <button
            onClick={() => navigate('/app/incidents')}
            className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-border rounded-xl text-navy text-sm font-medium active:bg-surface-2 transition-colors"
          >
            <List size={18} />
            View all incidents
          </button>
        </div>
      )}
    </div>
  )
}
