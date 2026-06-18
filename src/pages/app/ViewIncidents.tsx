import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { Modal } from '../../components/ui/Modal'
import { ConfirmModal } from '../../components/shared/ConfirmModal'
import { StatusBadge } from '../../components/ui/Badge'
import { formatDateTime } from '../../lib/utils'
import type { Incident, IncidentCategory, IncidentSeverity, IncidentStatus } from '../../types'

const SEV_COLORS: Record<IncidentSeverity, string> = {
  low: 'bg-teal/10 text-teal-dark',
  medium: 'bg-amber/15 text-amber-700',
  high: 'bg-danger/10 text-danger',
  critical: 'bg-red-100 text-red-900',
}

const STATUS_OPTIONS: IncidentStatus[] = ['logged', 'assigned', 'in_progress', 'resolved']

export function ViewIncidents() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [filter, setFilter] = useState<'all' | IncidentSeverity>('all')
  const [selected, setSelected] = useState<Incident | null>(null)
  const [criticalOpen, setCriticalOpen] = useState(false)
  const [criticalDone, setCriticalDone] = useState(false)
  const [declaring, setDeclaring] = useState(false)
  const [wsUrl, setWsUrl] = useState<string | null>(null)

  const eventId = localStorage.getItem('tide_event_id')

  useEffect(() => {
    if (!eventId) return
    api.get<Incident[]>(`/incidents?event_id=${eventId}`)
      .then(setIncidents)
      .catch(() => {})
  }, [eventId])

  useEffect(() => {
    api.post<{ url: string }>('/realtime/negotiate', {})
      .then(({ url }) => setWsUrl(url))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!wsUrl || !eventId) return
    const ws = new WebSocket(wsUrl)
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'incident.created' || msg.type === 'incident.updated') {
        api.get<Incident[]>(`/incidents?event_id=${eventId}`)
          .then(setIncidents)
          .catch(() => {})
      }
    }
    return () => ws.close()
  }, [wsUrl, eventId])

  async function updateStatus(id: string, status: IncidentStatus) {
    await api.patch(`/incidents/${id}`, { status, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
    setSelected(prev => prev ? { ...prev, status } : null)
    if (eventId) {
      api.get<Incident[]>(`/incidents?event_id=${eventId}`).then(setIncidents).catch(() => {})
    }
  }

  async function declareCritical() {
    setDeclaring(true)
    await api.post('/incidents', {
      event_id: eventId,
      tenant_id: user?.tenant_id,
      category: 'critical_declaration',
      severity: 'critical',
      description: `Critical incident declared by ${user?.name ?? user?.email}`,
      status: 'logged',
      logged_by: user?.id,
      reference_number: `CRITICAL-${Date.now()}`,
    })

    setDeclaring(false)
    setCriticalOpen(false)
    setCriticalDone(true)
    setTimeout(() => setCriticalDone(false), 5000)
  }

  const filtered = filter === 'all' ? incidents : incidents.filter(i => i.severity === filter)

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 bg-white border-b border-gray-200 sticky top-0 z-10">
        <button onClick={() => navigate('/app')} className="p-2 -ml-2">
          <ArrowLeft size={20} className="text-navy" />
        </button>
        <h1 className="text-base font-semibold text-navy">Incidents</h1>
        <span className="ml-auto text-xs text-gray-400">{incidents.length} total</span>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {(['all', 'low', 'medium', 'high', 'critical'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f ? 'bg-navy text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {criticalDone && (
        <div className="mx-4 mb-3 px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger font-medium flex items-center gap-2">
          <AlertTriangle size={16} />
          Critical incident declared. All staff alerted.
        </div>
      )}

      <div className="px-4 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">No incidents.</p>
        ) : filtered.map(inc => (
          <button
            key={inc.id}
            onClick={() => setSelected(inc)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-mono text-gray-400">{inc.reference_number}</span>
              <StatusBadge status={inc.status} />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${inc.severity ? SEV_COLORS[inc.severity] : ''}`}>
                {inc.severity}
              </span>
              <span className="text-sm font-medium text-navy capitalize">{inc.category?.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{inc.location_zone ?? '—'}</span>
              <span className="text-xs text-gray-400">{formatDateTime(inc.created_at)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Incident detail modal */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={`Incident ${selected.reference_number}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Category</span><p className="font-medium capitalize">{selected.category?.replace(/_/g, ' ')}</p></div>
              <div><span className="text-gray-500">Severity</span><p className="font-medium capitalize">{selected.severity}</p></div>
              <div><span className="text-gray-500">Location</span><p className="font-medium">{selected.location_zone ?? '—'}</p></div>
              <div><span className="text-gray-500">Logged</span><p className="font-medium">{formatDateTime(selected.created_at)}</p></div>
            </div>
            {selected.description && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-navy bg-gray-50 rounded-lg p-3">{selected.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-2">Update status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      selected.status === s ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Critical incident button */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-20">
        <button
          onClick={() => setCriticalOpen(true)}
          className="w-full bg-danger text-white py-4 rounded-xl font-semibold text-sm critical-pulse"
        >
          Declare critical incident
        </button>
      </div>

      <ConfirmModal
        open={criticalOpen}
        onClose={() => setCriticalOpen(false)}
        onConfirm={declareCritical}
        title="Declare critical incident"
        message="This will alert all staff on this event. Only use this in a genuine critical emergency. Are you sure?"
        confirmLabel="Declare"
        loading={declaring}
        danger
      />
    </div>
  )
}
