import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Radio, AlertTriangle, Users, MessageSquare, BarChart2,
  LogOut, ChevronLeft, Bell, Wifi, WifiOff, Siren
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { ROLE_LABELS } from '../../types'
import type { TideEvent, MajorIncident } from '../../types'

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#E8521A', letterSpacing: '0.05em' }}>
      {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

export function LiveLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const { data: liveEvent } = useQuery({
    queryKey: ['live-event'],
    queryFn: () => api.get<TideEvent[]>('/events?status=live').then(r => r[0] ?? null),
    refetchInterval: 30000,
  })

  const { data: majorIncident } = useQuery({
    queryKey: ['major-incident', liveEvent?.id],
    queryFn: () => liveEvent ? api.get<MajorIncident | null>(`/major-incident?event_id=${liveEvent.id}`) : null,
    enabled: !!liveEvent,
    refetchInterval: 10000,
  })

  const canDeclare = user && ['silver_command','event_manager','incident_manager','super_admin'].includes(user.role)

  const navItems = [
    { to: '/live', label: 'Operations', icon: Radio, end: true },
    { to: '/live/incidents', label: 'Incidents', icon: AlertTriangle },
    { to: '/live/resources', label: 'Resources', icon: Users },
    { to: '/live/comms', label: 'Comms', icon: MessageSquare },
    { to: '/live/reports', label: 'Reports', icon: BarChart2 },
  ]

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: '#0A0B0F' }}>

      {/* Major Incident Banner */}
      {majorIncident?.status === 'active' && (
        <div className="flex items-center justify-center gap-3 py-2 px-4 text-white text-sm font-bold uppercase tracking-widest"
          style={{ background: '#FF3B30', animation: 'critical-pulse 1.4s ease-in-out infinite' }}>
          <Siren size={16} />
          MAJOR INCIDENT DECLARED — {majorIncident.declared_by_name}
          <Siren size={16} />
        </div>
      )}

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 h-12 flex-shrink-0"
        style={{ background: '#111318', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Left: event info */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/mode-select')} className="text-white/30 hover:text-white/70 transition-colors mr-1">
            <ChevronLeft size={16} />
          </button>
          <div className="h-4 w-px bg-white/10" />
          {liveEvent ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full live-dot" style={{ background: '#34C759' }} />
                <span className="text-white font-bold text-sm truncate max-w-48">{liveEvent.name}</span>
              </div>
              {liveEvent.attendance_current > 0 && (
                <span className="hidden sm:block text-white/30 text-xs">
                  ATT: {liveEvent.attendance_current.toLocaleString()}
                </span>
              )}
            </>
          ) : (
            <span className="text-white/30 text-sm">No live event</span>
          )}
        </div>

        {/* Centre: clock */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <LiveClock />
        </div>

        {/* Right: status */}
        <div className="flex items-center gap-3">
          {!online && (
            <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#FF9500' }}>
              <WifiOff size={12} /> Offline
            </span>
          )}
          {online && (
            <Wifi size={14} className="text-white/20" />
          )}
          <div className="hidden sm:block text-right">
            <p className="text-white text-xs font-semibold leading-none">{user?.name}</p>
            <p className="text-white/30 text-xs leading-none mt-0.5">{ROLE_LABELS[user?.role ?? 'event_staff']}</p>
          </div>
          <button onClick={signOut} className="text-white/30 hover:text-white/70 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Left nav */}
        <nav className="flex flex-col py-3 gap-0.5 flex-shrink-0"
          style={{ width: 56, background: '#111318', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                `flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-white/30 hover:text-white/70'
                }`
              }
              style={({ isActive }) => isActive ? { background: 'rgba(232,82,26,0.15)', color: '#E8521A' } : {}}
            >
              <Icon size={18} />
            </NavLink>
          ))}

          <div className="flex-1" />

          {/* Major incident toggle */}
          {canDeclare && (
            <NavLink
              to="/live/major-incident"
              title="Major Incident"
              className={({ isActive }) =>
                `flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-all mb-1 ${isActive ? '' : 'hover:text-red-400'}`
              }
              style={({ isActive }) => ({
                background: majorIncident?.status === 'active' || isActive ? 'rgba(255,59,48,0.15)' : undefined,
                color: majorIncident?.status === 'active' || isActive ? '#FF3B30' : 'rgba(255,255,255,0.25)',
              })}
            >
              <Siren size={18} />
            </NavLink>
          )}
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
