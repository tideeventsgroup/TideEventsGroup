import React, { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Clock, MapPin, Users, CheckCircle, AlertTriangle,
  Edit2, Save, X, Plus, Radio, ChevronRight, Siren
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import type { Incident, IncidentAction, Resource, IncidentStatus } from '../../types'
import { PRIORITY_COLORS, STATUS_COLORS, PRIORITY_LABELS, INCIDENT_TYPES_BY_CATEGORY } from '../../types'

const STATUS_FLOW: IncidentStatus[] = ['new','assigned','en_route','on_scene','resolved','closed']
const STATUS_LABELS: Record<IncidentStatus, string> = {
  new: 'New', assigned: 'Assigned', en_route: 'En Route',
  on_scene: 'On Scene', resolved: 'Resolved', closed: 'Closed',
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`
}

export function LiveIncidentDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editResNotes, setEditResNotes] = useState('')

  const canUpdate = user && ['silver_command','incident_manager','cad_operator','operations_manager','event_manager','super_admin'].includes(user.role)

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => api.get<Incident & { actions: IncidentAction[] }>(`/incidents/${id}`),
    refetchInterval: 10000,
  })

  const { data: resources = [] } = useQuery({
    queryKey: ['live-resources', incident?.event_id],
    queryFn: () => incident ? api.get<Resource[]>(`/resources?event_id=${incident.event_id}`) : Promise.resolve([]),
    enabled: !!incident,
  })
  const availableResources = resources.filter(r => r.status === 'available' || r.assigned_incident_id === id)

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/incidents/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incident', id] }),
  })

  const addActionMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post(`/incidents/${id}/actions`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incident', id] }); setNewNote('') },
  })

  if (isLoading) return <div className="flex justify-center pt-12"><LoadingSpinner /></div>
  if (!incident) return <div className="flex items-center justify-center h-48 text-white/30">Incident not found</div>

  const pc = PRIORITY_COLORS[incident.priority]
  const currentStatusIdx = STATUS_FLOW.indexOf(incident.status as IncidentStatus)
  const nextStatus = STATUS_FLOW[currentStatusIdx + 1] as IncidentStatus | undefined

  return (
    <div className="flex flex-col h-full overflow-auto" style={{ background: '#0A0B0F' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: `4px solid ${pc.bg}` }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/live/incidents')} className="text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-white font-black text-xl font-mono">{incident.cad_number}</span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-sm font-black"
                style={{ background: pc.bg, color: pc.text }}>{incident.priority}</span>
            </div>
            <p className="text-white/40 text-xs mt-0.5">
              {incident.incident_type?.replace(/_/g,' ') ?? incident.category} · {incident.event_name} · {timeAgo(incident.created_at)}
            </p>
          </div>
        </div>

        {/* Advance status button */}
        {canUpdate && nextStatus && (
          <button
            onClick={() => updateMutation.mutate({ status: nextStatus })}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white transition-all"
            style={{
              background: nextStatus === 'resolved' ? 'rgba(52,199,89,0.2)' : 'rgba(232,82,26,0.2)',
              border: nextStatus === 'resolved' ? '1px solid rgba(52,199,89,0.4)' : '1px solid rgba(232,82,26,0.3)',
              color: nextStatus === 'resolved' ? '#34C759' : '#E8521A',
            }}>
            {nextStatus === 'resolved' ? <CheckCircle size={16} /> : <ChevronRight size={16} />}
            {updateMutation.isPending ? 'Updating…' : `Advance to: ${STATUS_LABELS[nextStatus]}`}
          </button>
        )}
      </div>

      {/* Status stepper */}
      <div className="flex items-center gap-0 px-5 py-3 flex-shrink-0"
        style={{ background: '#0D0E12', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {STATUS_FLOW.map((s, idx) => {
          const active = s === incident.status
          const done = idx < currentStatusIdx
          const sc = STATUS_COLORS[s as IncidentStatus]
          return (
            <React.Fragment key={s}>
              <button
                onClick={() => canUpdate && updateMutation.mutate({ status: s })}
                className={`flex flex-col items-center px-3 py-1.5 rounded-lg transition-all ${canUpdate ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
                style={{ opacity: done || active ? 1 : 0.35 }}>
                <div className="h-2 w-2 rounded-full mb-1"
                  style={{ background: active ? sc.text : done ? sc.text : 'rgba(255,255,255,0.15)' }} />
                <span className="text-xs font-semibold" style={{ color: active ? sc.text : done ? sc.text : 'rgba(255,255,255,0.3)' }}>
                  {STATUS_LABELS[s as IncidentStatus]}
                </span>
              </button>
              {idx < STATUS_FLOW.length - 1 && (
                <div className="flex-1 h-px" style={{ background: done ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)' }} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Body */}
      <div className="flex-1 grid grid-cols-3 gap-0 min-h-0">

        {/* Left: Details */}
        <div className="col-span-2 overflow-auto p-5 space-y-5" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Key info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/30 text-xs mb-2">Category / Type</p>
              <p className="text-white font-semibold capitalize">{incident.category}</p>
              <p className="text-white/50 text-sm capitalize">{incident.incident_type?.replace(/_/g,' ') ?? '—'}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/30 text-xs mb-2">Location</p>
              <div className="flex items-center gap-2">
                <MapPin size={14} style={{ color: '#4ECDC4' }} />
                <span className="text-white font-semibold">{incident.location_zone ?? '—'}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/30 text-xs mb-2">Logged By</p>
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: '#5B8CFF' }} />
                <span className="text-white">{incident.logged_by_name ?? '—'}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/30 text-xs mb-2">Assigned To</p>
              {canUpdate ? (
                <select
                  value={incident.assigned_to ?? ''}
                  onChange={e => updateMutation.mutate({ assigned_to: e.target.value || null })}
                  className="text-white text-sm bg-transparent outline-none w-full"
                  style={{ color: incident.assigned_to ? 'white' : 'rgba(255,255,255,0.3)' }}>
                  <option value="">Unassigned</option>
                  {availableResources.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.call_sign ?? r.type})</option>
                  ))}
                </select>
              ) : (
                <span className="text-white">{incident.assigned_to_name ?? 'Unassigned'}</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/30 text-xs">Description</p>
              {canUpdate && !editing && (
                <button onClick={() => { setEditing(true); setEditDesc(incident.description ?? '') }}
                  className="text-white/30 hover:text-white/70 transition-colors">
                  <Edit2 size={13} />
                </button>
              )}
            </div>
            {editing ? (
              <div>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={4}
                  className="w-full text-white text-sm resize-none outline-none rounded-lg p-3"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => { updateMutation.mutate({ description: editDesc }); setEditing(false) }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(52,199,89,0.15)', color: '#34C759' }}>
                    <Save size={12} /> Save
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/40 hover:text-white/70">
                    <X size={12} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-white text-sm leading-relaxed">{incident.description ?? 'No description provided.'}</p>
            )}
          </div>

          {/* Resolution notes (show when resolved/closed) */}
          {['resolved','closed'].includes(incident.status) && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.2)' }}>
              <p className="text-xs mb-3" style={{ color: 'rgba(52,199,89,0.6)' }}>Resolution Notes</p>
              {canUpdate ? (
                <div>
                  <textarea
                    value={editResNotes || incident.resolution_notes || ''}
                    onChange={e => setEditResNotes(e.target.value)}
                    onBlur={() => editResNotes && updateMutation.mutate({ resolution_notes: editResNotes })}
                    placeholder="Add resolution notes…"
                    rows={3}
                    className="w-full text-white text-sm resize-none outline-none rounded-lg p-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(52,199,89,0.2)' }} />
                </div>
              ) : (
                <p className="text-white text-sm">{incident.resolution_notes ?? 'No resolution notes.'}</p>
              )}
            </div>
          )}

          {/* Action log input */}
          {canUpdate && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/30 text-xs mb-3">Add to Timeline</p>
              <div className="flex gap-2">
                <input
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && newNote.trim() && (addActionMutation.mutate({ note: newNote, action_type: 'update' }), setNewNote(''))}
                  placeholder="Log an action or note… (Enter to submit)"
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <button
                  onClick={() => newNote.trim() && addActionMutation.mutate({ note: newNote, action_type: 'update' })}
                  disabled={!newNote.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-30 transition-all"
                  style={{ background: 'rgba(232,82,26,0.2)', color: '#E8521A' }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline */}
        <div className="overflow-auto p-5">
          <p className="text-white/30 text-xs font-bold uppercase tracking-wider mb-4">Timeline</p>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="space-y-4">
              {(incident.actions ?? []).map((action: IncidentAction, i) => (
                <div key={action.id} className="flex gap-3 relative pl-8">
                  <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full border-2"
                    style={{ borderColor: '#E8521A', background: '#0A0B0F' }} />
                  <div className="flex-1">
                    <p className="text-white text-xs font-semibold">{action.note}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/30 text-xs">{action.performed_by_name ?? 'System'}</span>
                      <span className="text-white/20 text-xs">·</span>
                      <span className="text-white/20 text-xs">{timeAgo(action.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(!incident.actions || incident.actions.length === 0) && (
                <p className="pl-8 text-white/20 text-xs">No timeline entries yet</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
