import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Siren, AlertTriangle, Clock, Plus, CheckCircle, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { TideEvent, MajorIncident, Incident, Resource } from '../../types'

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function datStr(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function elapsed(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function MajorIncidentPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [declaring, setDeclaring] = useState(false)
  const [declareDesc, setDeclareDesc] = useState('')
  const [newLogEntry, setNewLogEntry] = useState('')

  const canDeclare = user && ['silver_command','event_manager','incident_manager','super_admin'].includes(user.role)

  const { data: events = [] } = useQuery({
    queryKey: ['live-events'],
    queryFn: () => api.get<TideEvent[]>('/events?status=live'),
  })
  const liveEvent = events[0] ?? null

  const { data: majorIncident, refetch } = useQuery({
    queryKey: ['major-incident', liveEvent?.id],
    queryFn: () => liveEvent ? api.get<MajorIncident | null>(`/major-incident?event_id=${liveEvent.id}`) : null,
    enabled: !!liveEvent,
    refetchInterval: 10000,
  })

  const { data: incidents = [] } = useQuery({
    queryKey: ['live-incidents', liveEvent?.id],
    queryFn: () => liveEvent ? api.get<Incident[]>(`/incidents?event_id=${liveEvent.id}&limit=50`) : Promise.resolve([]),
    enabled: !!liveEvent,
    refetchInterval: 15000,
  })

  const { data: resources = [] } = useQuery({
    queryKey: ['live-resources', liveEvent?.id],
    queryFn: () => liveEvent ? api.get<Resource[]>(`/resources?event_id=${liveEvent.id}`) : Promise.resolve([]),
    enabled: !!liveEvent,
  })

  const declareMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/major-incident', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['major-incident'] }); setDeclaring(false); setDeclareDesc('') },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api.patch(`/major-incident/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['major-incident'] }); setNewLogEntry('') },
  })

  const active = majorIncident?.status === 'active'
  const criticalIncidents = incidents.filter(i => i.priority === 'P1' && !['resolved','closed'].includes(i.status))
  const openIncidents = incidents.filter(i => !['resolved','closed'].includes(i.status))
  const availableResources = resources.filter(r => r.status === 'available').length

  return (
    <div className="flex flex-col h-full overflow-auto" style={{ background: '#0A0B0F' }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{
          borderBottom: `1px solid ${active ? 'rgba(255,59,48,0.4)' : 'rgba(255,255,255,0.06)'}`,
          background: active ? 'rgba(255,59,48,0.06)' : undefined,
        }}>
        <div className="flex items-center gap-3">
          <Siren size={20} style={{ color: active ? '#FF3B30' : 'rgba(255,255,255,0.3)' }}
            className={active ? 'animate-pulse' : ''} />
          <div>
            <h1 className="font-bold text-lg" style={{ color: active ? '#FF3B30' : 'white' }}>
              {active ? 'MAJOR INCIDENT ACTIVE' : 'Major Incident Control'}
            </h1>
            {active && majorIncident && (
              <p className="text-xs" style={{ color: 'rgba(255,59,48,0.7)' }}>
                Declared by {majorIncident.declared_by_name} · {datStr(majorIncident.declared_at)} at {timeStr(majorIncident.declared_at)} · {elapsed(majorIncident.declared_at)} elapsed
              </p>
            )}
            {!active && <p className="text-white/30 text-xs">No major incident currently declared</p>}
          </div>
        </div>

        {canDeclare && !active && (
          <button
            onClick={() => setDeclaring(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white transition-all"
            style={{ background: 'rgba(255,59,48,0.15)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.3)' }}>
            <Siren size={16} /> Declare Major Incident
          </button>
        )}

        {canDeclare && active && majorIncident && (
          <button
            onClick={() => window.confirm('Stand down the Major Incident? This will end the declaration.') &&
              updateMutation.mutate({ id: majorIncident.id, body: { action: 'stand_down' } })}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all"
            style={{ background: 'rgba(52,199,89,0.15)', color: '#34C759', border: '1px solid rgba(52,199,89,0.3)' }}>
            <CheckCircle size={16} /> Stand Down
          </button>
        )}
      </div>

      <div className="flex-1 p-5 grid grid-cols-3 gap-5">

        {/* Status overview */}
        <div className="col-span-1 space-y-4">
          <div>
            <p className="text-white/30 text-xs font-bold uppercase tracking-wider mb-3">Operational Picture</p>
            <div className="space-y-2">
              {[
                { label: 'Open Incidents', value: openIncidents.length, color: '#FF9500', pulse: false },
                { label: 'P1 Critical', value: criticalIncidents.length, color: '#FF3B30', pulse: criticalIncidents.length > 0 },
                { label: 'Available Resources', value: availableResources, color: '#34C759', pulse: false },
                { label: 'Total Resources', value: resources.length, color: '#5B8CFF', pulse: false },
              ].map(({ label, value, color, pulse }) => (
                <div key={label}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl ${pulse && value > 0 ? 'critical-pulse' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.04)', border: pulse && value > 0 ? `1px solid ${color}40` : '1px solid transparent' }}>
                  <span className="text-white/50 text-sm">{label}</span>
                  <span className="font-black text-xl" style={{ color: value === 0 ? 'rgba(255,255,255,0.2)' : color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical incidents */}
          {criticalIncidents.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,59,48,0.6)' }}>
                P1 Incidents
              </p>
              <div className="space-y-2">
                {criticalIncidents.map(i => (
                  <div key={i.id} className="px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)' }}>
                    <p className="text-white text-xs font-bold font-mono">{i.cad_number}</p>
                    <p className="text-white/60 text-xs capitalize">{i.incident_type?.replace(/_/g,' ') ?? i.category}</p>
                    <p className="text-white/30 text-xs">{i.location_zone}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Strategic log */}
        <div className="col-span-2 flex flex-col">
          <p className="text-white/30 text-xs font-bold uppercase tracking-wider mb-3">Strategic Log</p>

          {active && majorIncident && (
            <>
              <div className="flex-1 overflow-auto rounded-xl p-4 mb-4 space-y-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', minHeight: 200 }}>
                {(majorIncident.strategic_log ?? []).length === 0 ? (
                  <p className="text-white/20 text-xs text-center py-4">No strategic log entries yet</p>
                ) : (
                  (majorIncident.strategic_log ?? []).map((entry, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex-shrink-0 text-xs font-mono text-white/25 pt-0.5">
                        {timeStr(entry.timestamp)}
                      </div>
                      <div>
                        <p className="text-white text-sm">{entry.entry}</p>
                        <p className="text-white/30 text-xs mt-0.5">— {entry.author}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canDeclare && (
                <div className="flex gap-2">
                  <input
                    value={newLogEntry}
                    onChange={e => setNewLogEntry(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && newLogEntry.trim() &&
                      updateMutation.mutate({ id: majorIncident.id, body: { action: 'add_log', entry: newLogEntry } })}
                    placeholder="Add strategic log entry… (Enter to submit)"
                    className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <button
                    onClick={() => newLogEntry.trim() &&
                      updateMutation.mutate({ id: majorIncident.id, body: { action: 'add_log', entry: newLogEntry } })}
                    disabled={!newLogEntry.trim()}
                    className="px-4 py-3 rounded-xl font-bold text-white disabled:opacity-30"
                    style={{ background: 'rgba(255,59,48,0.2)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.3)' }}>
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </>
          )}

          {!active && (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-8"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16 }}>
              <Siren size={48} className="text-white/10 mb-4" />
              <p className="text-white/30 text-sm mb-2">No major incident is currently active</p>
              <p className="text-white/20 text-xs">Only Silver Command and above can declare a major incident</p>
            </div>
          )}
        </div>
      </div>

      {/* Declare modal */}
      {declaring && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.9)' }}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: '#1a0505', border: '2px solid rgba(255,59,48,0.4)' }}>
            <div className="flex items-center gap-3 mb-5">
              <Siren size={24} style={{ color: '#FF3B30' }} />
              <h2 className="text-white font-black text-xl">Declare Major Incident</h2>
            </div>
            <p className="text-white/60 text-sm mb-5">
              This will activate Major Incident Mode for all users. A red command banner will be displayed across all screens.
            </p>
            <textarea
              value={declareDesc}
              onChange={e => setDeclareDesc(e.target.value)}
              placeholder="Describe the nature of the major incident…"
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none mb-5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,59,48,0.3)' }} />
            <div className="flex gap-3">
              <button
                onClick={() => liveEvent && declareMutation.mutate({
                  event_id: liveEvent.id, tenant_id: liveEvent.tenant_id, description: declareDesc,
                })}
                disabled={declareMutation.isPending}
                className="flex-1 py-3 rounded-xl font-black text-white text-lg"
                style={{ background: '#FF3B30' }}>
                {declareMutation.isPending ? 'Declaring…' : 'DECLARE MAJOR INCIDENT'}
              </button>
              <button onClick={() => setDeclaring(false)}
                className="px-5 py-3 rounded-xl font-semibold text-white/50"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
