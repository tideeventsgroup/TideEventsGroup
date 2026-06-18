import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle, ChevronDown, ChevronUp, Plus, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { ConfirmModal } from '../../components/shared/ConfirmModal'
import { formatDateTime } from '../../lib/utils'
import type { Incident, Event } from '../../types'

interface IncidentAction {
  id: string
  incident_id: string
  action_text: string
  performed_by: string
  performed_at: string
  actor_name?: string
}

function useLiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  return now
}

function severityStyle(severity: string | null): React.CSSProperties {
  switch (severity) {
    case 'critical': return { borderLeftColor: '#FF3B30', boxShadow: '0 0 20px rgba(255,59,48,0.12)' }
    case 'high':     return { borderLeftColor: '#FF9500' }
    case 'medium':   return { borderLeftColor: '#FFCC00' }
    case 'low':      return { borderLeftColor: '#34C759' }
    default:         return { borderLeftColor: '#3A3D4A' }
  }
}

function SevPill({ severity }: { severity: string | null }) {
  const map: Record<string, { bg: string; color: string }> = {
    critical: { bg: 'rgba(255,59,48,0.12)',  color: '#FF3B30' },
    high:     { bg: 'rgba(255,149,0,0.12)',  color: '#FF9500' },
    medium:   { bg: 'rgba(255,204,0,0.12)',  color: '#D9A800' },
    low:      { bg: 'rgba(52,199,89,0.12)',  color: '#34C759' },
  }
  const s = map[severity ?? ''] ?? { bg: 'rgba(255,255,255,0.08)', color: '#7C7F96' }
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: s.bg, color: s.color }}>
      {severity ?? 'unknown'}
    </span>
  )
}

function StatPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    logged:      { bg: 'rgba(124,127,150,0.15)', color: '#7C7F96' },
    assigned:    { bg: 'rgba(91,140,255,0.15)',  color: '#5B8CFF' },
    in_progress: { bg: 'rgba(78,205,196,0.15)',  color: '#4ECDC4' },
    resolved:    { bg: 'rgba(52,199,89,0.15)',   color: '#34C759' },
  }
  const s = map[status] ?? { bg: 'rgba(255,255,255,0.08)', color: '#7C7F96' }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: s.bg, color: s.color }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function MetricBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1.5" style={{ fontSize: 12 }}>
        <span className="capitalize" style={{ color: '#7C7F96' }}>{label}</span>
        <span style={{ color: '#F0F1F5', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function ActionPanel({ incidentId }: { incidentId: string }) {
  const qc = useQueryClient()
  const [text, setText] = useState('')

  const { data: actions = [] } = useQuery<IncidentAction[]>({
    queryKey: ['incident-actions', incidentId],
    queryFn: () => api.get<IncidentAction[]>(`/incident-actions?incident_id=${incidentId}`),
  })

  const logAction = useMutation({
    mutationFn: () => api.post('/incident-actions', { incident_id: incidentId, action_text: text }),
    onSuccess: () => { setText(''); qc.invalidateQueries({ queryKey: ['incident-actions', incidentId] }) },
  })

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#52566A', letterSpacing: '0.08em' }}>Action log</p>
      {actions.length === 0 ? (
        <p className="text-xs mb-3" style={{ color: '#52566A' }}>No actions logged yet.</p>
      ) : (
        <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
          {[...actions]
            .sort((a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime())
            .map(a => (
              <div key={a.id} className="flex gap-2 text-xs">
                <Clock size={11} className="flex-shrink-0 mt-0.5" style={{ color: '#52566A' }} />
                <div>
                  <span style={{ color: '#52566A' }}>{formatDateTime(a.performed_at)}</span>
                  {a.actor_name && <span className="font-semibold ml-1.5" style={{ color: '#E8521A' }}>{a.actor_name}</span>}
                  <p style={{ color: '#B0B3C8', marginTop: 1 }}>{a.action_text}</p>
                </div>
              </div>
            ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Log an action taken..."
          className="flex-1 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F1F5', '--tw-ring-color': '#E8521A' } as React.CSSProperties}
          onKeyDown={e => { if (e.key === 'Enter' && text.trim()) logAction.mutate() }}
        />
        <button
          onClick={() => logAction.mutate()}
          disabled={!text.trim() || logAction.isPending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all active:scale-95"
          style={{ background: '#E8521A', color: 'white' }}
        >
          <Plus size={12} />
          Log
        </button>
      </div>
    </div>
  )
}

export function LiveEventDashboard() {
  useAuth()
  const qc = useQueryClient()
  const now = useLiveClock()

  const eventId   = localStorage.getItem('tide_event_id') ?? ''
  const eventName = localStorage.getItem('tide_event_name') ?? 'Live Event'

  const [declareOpen, setDeclareOpen] = useState(false)
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ['incidents', eventId],
    enabled: !!eventId,
    queryFn: () => api.get<Incident[]>(`/incidents?event_id=${eventId}`),
    refetchInterval: 15000,
  })

  const { data: event } = useQuery<Event>({
    queryKey: ['event', eventId],
    enabled: !!eventId,
    queryFn: () => api.get<Event>(`/events/${eventId}`),
  })

  useEffect(() => {
    if (!eventId) return
    let ws: WebSocket | null = null
    api.post<{ url: string }>('/realtime/negotiate', {})
      .then(({ url }) => {
        ws = new WebSocket(url)
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data)
            if (msg.type === 'incident.created' || msg.type === 'incident.updated') {
              qc.invalidateQueries({ queryKey: ['incidents', eventId] })
            }
          } catch { /* ignore */ }
        }
      })
      .catch(() => { /* polling fallback active */ })
    return () => { ws?.close() }
  }, [eventId, qc])

  const open        = incidents.filter(i => i.status !== 'resolved')
  const resolved    = incidents.filter(i => i.status === 'resolved')
  const critHigh    = incidents.filter(i => i.severity === 'critical' || i.severity === 'high')
  const critical    = incidents.filter(i => i.severity === 'critical')

  async function handleDeclareCritical() {
    await api.post('/incidents', {
      event_id: eventId,
      tenant_id: event?.tenant_id,
      category: 'critical_declaration',
      severity: 'critical',
      description: 'Critical incident declared from Live Dashboard',
      status: 'logged',
    })
    qc.invalidateQueries({ queryKey: ['incidents', eventId] })
    setDeclareOpen(false)
  }

  const bg     = '#0D0E12'
  const surf   = '#161820'
  const border = 'rgba(255,255,255,0.07)'
  const text1  = '#F0F1F5'
  const text2  = '#7C7F96'
  const text3  = '#52566A'

  return (
    <div style={{ background: bg, minHeight: '100vh', color: text1, padding: '24px 24px 40px' }}>

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-7">
        <div className="flex items-center gap-3">
          <Link
            to="/client/events"
            className="flex items-center justify-center rounded-xl transition-colors"
            style={{ background: surf, border: `1px solid ${border}`, height: 36, width: 36 }}
          >
            <ArrowLeft size={16} style={{ color: text2 }} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-bold" style={{ fontSize: 20, color: text1, letterSpacing: '-0.02em' }}>{eventName}</h1>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                style={{ background: 'rgba(255,59,48,0.12)', color: '#FF3B30', letterSpacing: '0.08em' }}
              >
                <span className="h-1.5 w-1.5 rounded-full live-dot" style={{ background: '#FF3B30' }} />
                LIVE
              </span>
            </div>
            {event && <p className="text-xs mt-0.5" style={{ color: text3 }}>{event.venue_name}</p>}
          </div>
        </div>
        <div
          className="font-mono tabular-nums text-right"
          style={{ fontSize: 28, fontWeight: 800, color: text1, letterSpacing: '0.02em', lineHeight: 1 }}
        >
          {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {[
          { label: 'Total Logged',  value: incidents.length, color: text1,     subcolor: text3 },
          { label: 'Open',          value: open.length,      color: '#FF9500',  subcolor: text3 },
          { label: 'Critical/High', value: critHigh.length,  color: critical.length > 0 ? '#FF3B30' : '#FF9500', subcolor: text3, pulse: critical.length > 0 },
          { label: 'Resolved',      value: resolved.length,  color: '#34C759',  subcolor: text3 },
        ].map(tile => (
          <div
            key={tile.label}
            className={`flex flex-col p-5 rounded-2xl ${tile.pulse ? 'critical-pulse' : ''}`}
            style={{ background: surf, border: `1px solid ${border}` }}
          >
            <span
              style={{ fontSize: 42, fontWeight: 800, color: tile.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
            >
              {tile.value}
            </span>
            <span className="mt-2 text-xs font-semibold uppercase tracking-wider" style={{ color: tile.subcolor, letterSpacing: '0.08em' }}>
              {tile.label}
            </span>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Incident stream */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: text3, letterSpacing: '0.1em' }}>
              Incident stream
            </h2>
            <span className="text-xs" style={{ color: text3 }}>{incidents.length} total</span>
          </div>

          {incidents.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center rounded-2xl"
              style={{ background: surf, border: `1px solid ${border}` }}
            >
              <div className="text-3xl mb-3">🎯</div>
              <p style={{ color: text2, fontSize: 14 }}>No incidents logged yet</p>
              <p style={{ color: text3, fontSize: 12, marginTop: 4 }}>Incidents will appear here in real time</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...incidents]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map(incident => (
                  <div
                    key={incident.id}
                    className="rounded-2xl border-l-4 overflow-hidden"
                    style={{
                      background: surf,
                      border: `1px solid ${border}`,
                      ...severityStyle(incident.severity),
                    }}
                  >
                    <button
                      className="w-full text-left px-4 py-3.5"
                      onClick={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-xs" style={{ color: text3 }}>
                              {incident.reference_number ?? '—'}
                            </span>
                            <SevPill severity={incident.severity} />
                            <span className="text-xs capitalize" style={{ color: text2 }}>
                              {incident.category?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          {incident.location_zone && (
                            <p className="text-xs" style={{ color: text3 }}>📍 {incident.location_zone}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                          <StatPill status={incident.status} />
                          <span className="text-xs" style={{ color: text3 }}>{formatDateTime(incident.created_at)}</span>
                          {expandedId === incident.id
                            ? <ChevronUp size={14} style={{ color: text3 }} />
                            : <ChevronDown size={14} style={{ color: text3 }} />}
                        </div>
                      </div>
                    </button>
                    {expandedId === incident.id && (
                      <div className="px-4 pb-4">
                        <ActionPanel incidentId={incident.id} />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">

          {/* Severity breakdown */}
          <div className="rounded-2xl p-5" style={{ background: surf, border: `1px solid ${border}` }}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: text3, letterSpacing: '0.1em' }}>
              By severity
            </h3>
            {(['critical', 'high', 'medium', 'low'] as const).map((sev, i) => {
              const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759']
              return (
                <MetricBar
                  key={sev}
                  label={sev}
                  count={incidents.filter(x => x.severity === sev).length}
                  total={incidents.length}
                  color={colors[i]}
                />
              )
            })}
          </div>

          {/* Status breakdown */}
          <div className="rounded-2xl p-5" style={{ background: surf, border: `1px solid ${border}` }}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: text3, letterSpacing: '0.1em' }}>
              By status
            </h3>
            {(['logged', 'assigned', 'in_progress', 'resolved'] as const).map((st, i) => {
              const colors = ['#7C7F96', '#5B8CFF', '#4ECDC4', '#34C759']
              return (
                <MetricBar
                  key={st}
                  label={st.replace(/_/g, ' ')}
                  count={incidents.filter(x => x.status === st).length}
                  total={incidents.length}
                  color={colors[i]}
                />
              )
            })}
          </div>

          {/* Declare critical */}
          <button
            onClick={() => setDeclareOpen(true)}
            className="w-full flex items-center justify-center gap-2.5 font-bold rounded-2xl transition-all active:scale-[0.97] critical-pulse"
            style={{
              background: 'linear-gradient(135deg, #FF3B30 0%, #C0150A 100%)',
              color: 'white',
              height: 56,
              fontSize: 15,
              boxShadow: '0 8px 28px rgba(255,59,48,0.35)',
            }}
          >
            <AlertTriangle size={18} />
            Declare Critical Incident
          </button>
        </div>
      </div>

      <ConfirmModal
        open={declareOpen}
        onClose={() => setDeclareOpen(false)}
        onConfirm={handleDeclareCritical}
        title="Declare critical incident?"
        message="This will log a critical incident declaration visible to all parties. This action cannot be undone."
        confirmLabel="Declare critical"
        danger
      />
    </div>
  )
}
