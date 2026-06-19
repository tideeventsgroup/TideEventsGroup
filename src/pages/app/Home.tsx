import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BookOpen, Map, Phone, List, ChevronRight, Activity, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Incident } from '../../types'

function LiveClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id) }, [])
  return (
    <span className="font-mono tabular-nums" style={{ color: '#E8521A', fontSize: 14, fontWeight: 700 }}>
      {t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', client_admin: 'Event Manager', client_staff: 'Event Staff',
  tide_consultant: 'Tide Consultant', gold_command: 'Gold Command', silver_command: 'Silver Command',
  event_manager: 'Event Manager', security_manager: 'Security', medical_lead: 'Medical Lead',
  event_staff: 'Event Staff', comms_officer: 'Comms Officer', cad_operator: 'CAD Operator',
}

const QUICK_ACTIONS = [
  { label: 'My Briefing',  sub: 'Role & procedures',  to: '/app/briefing',  Icon: BookOpen, accent: '#4ECDC4' },
  { label: 'Site Map',     sub: 'Venue layout',        to: '/app/site-map',  Icon: Map,      accent: '#5B8CFF' },
  { label: 'Emergency',    sub: 'Key contacts',        to: '/app/emergency', Icon: Phone,    accent: '#FF9500' },
  { label: 'All Incidents',sub: 'View incident log',   to: '/app/incidents', Icon: List,     accent: '#A78BFA' },
]

export function AppHome() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const eventId   = localStorage.getItem('tide_event_id') ?? ''
  const eventName = localStorage.getItem('tide_event_name') ?? 'Your event'

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ['incidents', eventId],
    enabled: !!eventId,
    queryFn: () => api.get<Incident[]>(`/incidents?event_id=${eventId}`),
    refetchInterval: 30000,
  })

  const openCount     = incidents.filter(i => !['resolved', 'closed'].includes(i.status)).length
  const criticalCount = incidents.filter(i => i.priority === 'P1' && !['resolved', 'closed'].includes(i.status)).length

  return (
    <div style={{ background: '#0A0B0F', minHeight: '100dvh', color: '#F0F1F5' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 20px)', paddingBottom: 16 }}>
        <div>
          <p style={{ color: '#5B5E72', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            {ROLE_LABELS[user?.role ?? ''] ?? 'Staff'}
          </p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#F0F1F5', marginTop: 2, letterSpacing: '-0.02em' }}>
            Hey, {user?.name?.split(' ')[0] ?? 'there'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <LiveClock />
          <p style={{ fontSize: 11, color: '#5B5E72' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      {/* Event banner */}
      <div className="mx-4 mb-5 rounded-2xl px-4 py-3.5 flex items-center gap-3"
        style={{ background: '#131520', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(52,199,89,0.12)', width: 38, height: 38 }}>
          <Activity size={16} style={{ color: '#34C759' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p style={{ fontSize: 14, fontWeight: 700, color: '#F0F1F5' }} className="truncate">{eventName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#34C759' }} />
            <p style={{ fontSize: 11, color: '#5B5E72', fontWeight: 600 }}>LIVE EVENT</p>
          </div>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl flex-shrink-0"
            style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.2)' }}>
            <AlertTriangle size={12} style={{ color: '#FF3B30' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#FF3B30' }}>{criticalCount} CRIT</span>
          </div>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2.5 mx-4 mb-5">
        {[
          { label: 'Total',    value: incidents.length, color: '#F0F1F5', sub: 'incidents' },
          { label: 'Open',     value: openCount,        color: '#FF9500', sub: 'active' },
          { label: 'Critical', value: criticalCount,    color: '#FF3B30', sub: 'P1 priority' },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center py-4 rounded-2xl"
            style={{ background: '#131520', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {s.value}
            </span>
            <span style={{ fontSize: 10, color: '#5B5E72', marginTop: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* LOG INCIDENT — Hero CTA */}
      <div className="mx-4 mb-4">
        <button
          onClick={() => navigate('/app/log-incident')}
          className="w-full flex items-center gap-4 active:scale-[0.98] transition-transform"
          style={{ background: 'linear-gradient(135deg,#E8521A 0%,#C94115 100%)', borderRadius: 20, padding: '18px 22px', boxShadow: '0 8px 32px rgba(232,82,26,0.35)' }}>
          <div className="flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', height: 52, width: 52 }}>
            <AlertTriangle size={26} color="white" />
          </div>
          <div className="text-left flex-1">
            <div style={{ color: 'white', fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>Log Incident</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 }}>Tap to report immediately</div>
          </div>
          <ChevronRight size={22} color="rgba(255,255,255,0.4)" />
        </button>
      </div>

      {/* Quick action cards */}
      <div className="px-4 mb-2">
        <p style={{ fontSize: 11, fontWeight: 700, color: '#5B5E72', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Quick Access
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 mx-4 mb-8">
        {QUICK_ACTIONS.map(({ label, sub, to, Icon, accent }) => (
          <button key={to} onClick={() => navigate(to)}
            className="flex flex-col p-4 active:scale-[0.97] transition-transform text-left"
            style={{ background: '#131520', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 18, minHeight: 100 }}>
            <div className="flex items-center justify-center rounded-xl mb-3 flex-shrink-0"
              style={{ background: `${accent}18`, width: 40, height: 40, border: `1px solid ${accent}22` }}>
              <Icon size={18} style={{ color: accent }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F1F5', letterSpacing: '-0.01em' }}>{label}</div>
            <div style={{ fontSize: 11, color: '#5B5E72', marginTop: 3 }}>{sub}</div>
          </button>
        ))}
      </div>

      {/* Security watermark */}
      <div className="text-center pb-8">
        <div className="inline-flex items-center gap-1.5">
          <Shield size={10} style={{ color: '#2A2D3E' }} />
          <p style={{ fontSize: 10, color: '#2A2D3E', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            TIDE Secure · {user?.role?.replace(/_/g, ' ').toUpperCase()}
          </p>
        </div>
      </div>

    </div>
  )
}
