import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle, ChevronDown, ChevronUp, Plus, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { ConfirmModal } from '../../components/shared/ConfirmModal'
import { StatusBadge } from '../../components/ui/Badge'
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

function ActionPanel({ incidentId }: { incidentId: string }) {
  const qc = useQueryClient()
  const [text, setText] = useState('')

  const { data: actions = [] } = useQuery<IncidentAction[]>({
    queryKey: ['incident-actions', incidentId],
    queryFn: () => api.get<IncidentAction[]>(`/incident-actions?incident_id=${incidentId}`),
  })

  const logAction = useMutation({
    mutationFn: () => api.post('/incident-actions', { incident_id: incidentId, action_text: text }),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['incident-actions', incidentId] })
    },
  })

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Action log</h4>
      {actions.length === 0 ? (
        <p className="text-xs text-gray-400 mb-3">No actions logged yet.</p>
      ) : (
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {[...actions].sort((a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime()).map(a => (
            <div key={a.id} className="flex gap-2 text-xs">
              <Clock size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-400">{formatDateTime(a.performed_at)}</span>
                {a.actor_name && <span className="text-navy font-medium ml-1">{a.actor_name}</span>}
                <p className="text-gray-700">{a.action_text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Log an action..."
          className="input-field flex-1 text-xs py-1.5"
          onKeyDown={e => { if (e.key === 'Enter' && text.trim()) logAction.mutate() }}
        />
        <button
          onClick={() => logAction.mutate()}
          disabled={!text.trim() || logAction.isPending}
          className="btn btn-primary btn-sm flex items-center gap-1"
        >
          <Plus size={12} />
          Log
        </button>
      </div>
    </div>
  )
}

function useLiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function severityBorderClass(severity: string | null) {
  switch (severity) {
    case 'critical': return 'border-l-4 border-l-red-600 animate-critical-pulse'
    case 'high':     return 'border-l-4 border-l-red-400'
    case 'medium':   return 'border-l-4 border-l-amber'
    case 'low':      return 'border-l-4 border-l-green-500'
    default:         return 'border-l-4 border-l-gray-300'
  }
}

function SeverityBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="capitalize">{label}</span>
        <span>{count}</span>
      </div>
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function LiveEventDashboard() {
  useAuth()
  const qc = useQueryClient()
  const now = useLiveClock()

  const eventId = localStorage.getItem('tide_event_id') ?? ''
  const eventName = localStorage.getItem('tide_event_name') ?? 'Live Event'

  const [declareOpen, setDeclareOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ['incidents', eventId],
    enabled: !!eventId,
    queryFn: () => api.get<Incident[]>(`/incidents?event_id=${eventId}`),
    refetchInterval: 30000,
  })

  const { data: event } = useQuery<Event>({
    queryKey: ['event', eventId],
    enabled: !!eventId,
    queryFn: () => api.get<Event>(`/events/${eventId}`),
  })

  // Web PubSub realtime
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
          } catch {
            // ignore parse errors
          }
        }
      })
      .catch(() => {
        // realtime unavailable — polling fallback is already active
      })

    return () => { ws?.close() }
  }, [eventId, qc])

  const open = incidents.filter(i => i.status !== 'resolved')
  const resolved = incidents.filter(i => i.status === 'resolved')
  const criticalHigh = incidents.filter(i => i.severity === 'critical' || i.severity === 'high')

  const bySeverity = ['critical', 'high', 'medium', 'low'] as const
  const severityColors: Record<string, string> = {
    critical: 'bg-red-600',
    high: 'bg-red-400',
    medium: 'bg-amber',
    low: 'bg-green-500',
  }

  const byStatus = ['logged', 'assigned', 'in_progress', 'resolved'] as const
  const statusColors: Record<string, string> = {
    logged: 'bg-gray-400',
    assigned: 'bg-navy',
    in_progress: 'bg-teal',
    resolved: 'bg-green-500',
  }

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

  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link to="/client/events" className="text-gray-400 hover:text-navy transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-navy">{eventName}</h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            </div>
            {event && (
              <p className="text-xs text-gray-400 mt-0.5">{event.venue_name}</p>
            )}
          </div>
        </div>
        <div className="text-sm font-mono text-gray-500 tabular-nums">
          {now.toLocaleTimeString('en-GB')}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-sm text-center">
          <div className="text-2xl font-bold text-navy">{incidents.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total logged</div>
        </div>
        <div className="card-sm text-center">
          <div className="text-2xl font-bold text-teal">{open.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Open</div>
        </div>
        <div className="card-sm text-center">
          <div className="text-2xl font-bold text-red-600">{criticalHigh.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Critical / High</div>
        </div>
        <div className="card-sm text-center">
          <div className="text-2xl font-bold text-green-600">{resolved.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Resolved</div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — incident list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wide">Recent incidents</h2>
          {incidents.length === 0 ? (
            <div className="card-sm text-center text-gray-400 text-sm py-8">No incidents logged yet</div>
          ) : (
            [...incidents]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map(incident => (
                <div
                  key={incident.id}
                  className={`bg-white rounded-lg px-4 py-3 shadow-sm ${severityBorderClass(incident.severity)}`}
                >
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">{incident.reference_number ?? '—'}</span>
                          {incident.severity && (
                            <StatusBadge status={incident.severity} />
                          )}
                          <span className="text-xs text-gray-500 capitalize">{incident.category?.replace(/_/g, ' ')}</span>
                        </div>
                        {incident.location_zone && (
                          <p className="text-xs text-gray-400 mt-0.5">{incident.location_zone}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <StatusBadge status={incident.status} />
                        <span className="text-2xs text-gray-400">{formatDateTime(incident.created_at)}</span>
                        {expandedId === incident.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                      </div>
                    </div>
                  </button>
                  {expandedId === incident.id && <ActionPanel incidentId={incident.id} />}
                </div>
              ))
          )}
        </div>

        {/* Right — charts + declare */}
        <div className="space-y-5">

          {/* Severity breakdown */}
          <div className="card-sm">
            <h3 className="text-sm font-semibold text-navy mb-3">By severity</h3>
            {bySeverity.map(sev => (
              <SeverityBar
                key={sev}
                label={sev}
                count={incidents.filter(i => i.severity === sev).length}
                total={incidents.length}
                color={severityColors[sev]}
              />
            ))}
          </div>

          {/* Status breakdown */}
          <div className="card-sm">
            <h3 className="text-sm font-semibold text-navy mb-3">By status</h3>
            {byStatus.map(st => (
              <SeverityBar
                key={st}
                label={st.replace(/_/g, ' ')}
                count={incidents.filter(i => i.status === st).length}
                total={incidents.length}
                color={statusColors[st]}
              />
            ))}
          </div>

          {/* Declare critical */}
          <button
            onClick={() => setDeclareOpen(true)}
            className="btn btn-danger btn-lg w-full animate-critical-pulse"
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
        message="This will log a critical incident declaration and alert all relevant parties. This action cannot be undone."
        confirmLabel="Declare critical"
        danger
      />
    </div>
  )
}
