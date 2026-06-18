import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Zap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Incident } from '../../types'

function LiveClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id) }, [])
  return (
    <span className="font-mono tabular-nums" style={{ color: '#7C7F96', fontSize: 13 }}>
      {t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

export function AppHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const eventId   = localStorage.getItem('tide_event_id') ?? ''
  const eventName = localStorage.getItem('tide_event_name') ?? 'Your event'

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ['incidents', eventId],
    enabled: !!eventId,
    queryFn: () => api.get<Incident[]>(`/incidents?event_id=${eventId}`),
    refetchInterval: 30000,
  })

  const openCount     = incidents.filter(i => i.status !== 'resolved').length
  const criticalCount = incidents.filter(i => i.severity === 'critical').length

  const roleLabel: Record<string, string> = {
    super_admin:     'Super Admin',
    client_admin:    'Event Manager',
    client_staff:    'Event Staff',
    tide_consultant: 'Tide Consultant',
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div style={{ background: '#0D0E12', minHeight: '100dvh', color: '#F0F1F5' }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-5"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
          paddingBottom: 16,
        }}
      >
        <div>
          <p style={{ color: '#7C7F96', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            {roleLabel[user?.role ?? ''] ?? 'Staff'}
          </p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#F0F1F5', marginTop: 2 }}>
            {user?.name?.split(' ')[0] ?? 'Welcome'}
          </p>
        </div>
        <div className="text-right">
          <div style={{ fontSize: 12, color: '#52566A' }}>{today}</div>
          <LiveClock />
        </div>
      </div>

      {/* Event banner */}
      <div className="mx-4 mb-5 rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="h-2 w-2 rounded-full live-dot flex-shrink-0" style={{ background: '#34C759' }} />
        <div className="min-w-0 flex-1">
          <p style={{ fontSize: 13, fontWeight: 600, color: '#F0F1F5' }} className="truncate">{eventName}</p>
          <p style={{ fontSize: 11, color: '#52566A' }}>Active event</p>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,59,48,0.12)' }}>
            <AlertTriangle size={12} style={{ color: '#FF3B30' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#FF3B30' }}>{criticalCount} CRITICAL</span>
          </div>
        )}
      </div>

      {/* Incident stats strip */}
      {incidents.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mx-4 mb-5">
          {[
            { label: 'Total',    value: incidents.length, color: '#F0F1F5' },
            { label: 'Open',     value: openCount,        color: '#FF9500' },
            { label: 'Critical', value: criticalCount,    color: '#FF3B30' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-3 rounded-xl" style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              <span style={{ fontSize: 10, color: '#52566A', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* LOG INCIDENT — Hero CTA */}
      <div className="mx-4 mb-4">
        <button
          onClick={() => navigate('/app/log-incident')}
          className="w-full flex items-center gap-4 active:scale-[0.98] transition-transform"
          style={{
            background: 'linear-gradient(135deg, #E8521A 0%, #C94115 100%)',
            borderRadius: 20,
            padding: '20px 24px',
            boxShadow: '0 8px 32px rgba(232,82,26,0.35)',
          }}
        >
          <div
            className="flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', height: 52, width: 52 }}
          >
            <AlertTriangle size={28} color="white" />
          </div>
          <div className="text-left">
            <div style={{ color: 'white', fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>Log Incident</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 }}>Tap to report now</div>
          </div>
          <div className="ml-auto">
            <Zap size={20} color="rgba(255,255,255,0.4)" />
          </div>
        </button>
      </div>

      {/* Quick action cards — 2×2 grid */}
      <div className="grid grid-cols-2 gap-3 mx-4 mb-6">
        {[
          { label: 'My Briefing',    sub: 'Role & procedures',    to: '/app/briefing',  emoji: '📋', accent: '#4ECDC4' },
          { label: 'Site Map',       sub: 'Venue layout',          to: '/app/site-map',  emoji: '🗺️', accent: '#5B8CFF' },
          { label: 'Emergency',      sub: 'Key contacts',          to: '/app/emergency', emoji: '📞', accent: '#FF9500' },
          { label: 'Incidents',      sub: 'View all logged',       to: '/app/incidents', emoji: '📊', accent: '#9B59B6' },
        ].map(card => (
          <button
            key={card.to}
            onClick={() => navigate(card.to)}
            className="flex flex-col p-4 active:scale-[0.97] transition-transform text-left"
            style={{
              background: '#161820',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              minHeight: 96,
            }}
          >
            <span style={{ fontSize: 26, lineHeight: 1, marginBottom: 10 }}>{card.emoji}</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F1F5' }}>{card.label}</div>
            <div style={{ fontSize: 11, color: '#52566A', marginTop: 2 }}>{card.sub}</div>
          </button>
        ))}
      </div>

    </div>
  )
}
