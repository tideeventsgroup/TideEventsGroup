import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Clock, User, CheckCircle, AlertTriangle, Edit2, Save, X, ArrowUpRight } from 'lucide-react'
import { api } from '../../lib/api'
import { formatDateTime } from '../../lib/utils'
import type { User as UserType } from '../../types'

interface IncidentFull {
  id: string
  reference_number: string
  event_id: string
  tenant_id: string
  category: string
  severity: string | null
  description: string | null
  location_zone: string | null
  photo_url: string | null
  status: string
  logged_by: string | null
  assigned_to: string | null
  resolution_notes: string | null
  created_at: string
  resolved_at: string | null
  event_name: string | null
  tenant_name: string | null
  logged_by_name: string | null
  assigned_to_name: string | null
}

interface Action {
  id: string
  incident_id: string
  action_text: string
  performed_by: string | null
  performed_at: string
  actor_name?: string
}

const STATUSES = ['logged', 'assigned', 'in_progress', 'resolved'] as const
const STATUS_LABELS: Record<string, string> = { logged: 'Logged', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved' }
const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  logged:      { bg: '#F9FAFB', color: '#6B7280', border: '#D1D5DB' },
  assigned:    { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  in_progress: { bg: '#FFF5F0', color: '#E8521A', border: '#FDBA97' },
  resolved:    { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
}
const SEV_COLORS: Record<string, { bg: string; color: string }> = {
  critical: { bg: '#FFF1F0', color: '#FF3B30' },
  high:     { bg: '#FFFBEB', color: '#D97706' },
  medium:   { bg: '#FEFCE8', color: '#B45309' },
  low:      { bg: '#F0FDF4', color: '#16A34A' },
}

export function IncidentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const qc        = useQueryClient()

  const [editing, setEditing]         = useState(false)
  const [actionText, setActionText]   = useState('')
  const [editForm, setEditForm]       = useState<Partial<IncidentFull>>({})
  const [resolutionNotes, setResolutionNotes] = useState('')

  const { data: incident, isLoading } = useQuery<IncidentFull>({
    queryKey: ['incident', id],
    queryFn: () => api.get<IncidentFull>(`/incidents/${id}`),
    enabled: !!id,
  })

  const { data: actions = [] } = useQuery<Action[]>({
    queryKey: ['incident-actions', id],
    queryFn: () => api.get<Action[]>(`/incident-actions?incident_id=${id}`),
    enabled: !!id,
    refetchInterval: 15000,
  })

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['users'],
    queryFn: () => api.get<UserType[]>('/users'),
  })

  const updateMut = useMutation({
    mutationFn: (patch: Record<string, unknown>) => api.patch(`/incidents/${id}`, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incident', id] })
      qc.invalidateQueries({ queryKey: ['admin-incidents'] })
      setEditing(false)
    },
  })

  const logActionMut = useMutation({
    mutationFn: (text: string) => api.post('/incident-actions', { incident_id: id, action_text: text }),
    onSuccess: () => {
      setActionText('')
      qc.invalidateQueries({ queryKey: ['incident-actions', id] })
    },
  })

  if (isLoading || !incident) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-7 w-7 rounded-full border-2 border-gray-200 border-t-[#E8521A]" />
      </div>
    )
  }

  const inc = incident!
  const currentStatusIdx = STATUSES.indexOf(inc.status as typeof STATUSES[number])
  const sc = STATUS_COLORS[inc.status] ?? STATUS_COLORS.logged
  const sevColor = SEV_COLORS[inc.severity ?? ''] ?? { bg: '#F9FAFB', color: '#6B7280' }

  function startEdit() {
    setEditForm({
      category: inc.category,
      severity: inc.severity ?? '',
      description: inc.description ?? '',
      location_zone: inc.location_zone ?? '',
    })
    setEditing(true)
  }

  function handleResolve() {
    updateMut.mutate({ status: 'resolved', resolution_notes: resolutionNotes || undefined })
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Back + header */}
      <div className="flex items-start gap-3 mb-6">
        <button onClick={() => navigate('/admin/incidents')} className="btn btn-outline btn-sm mt-1">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F0F14' }}>
              {incident.reference_number}
            </h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
              style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
              {STATUS_LABELS[incident.status]}
            </span>
            {incident.severity && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
                style={{ background: sevColor.bg, color: sevColor.color }}>
                {incident.severity}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#9898AE', marginTop: 4 }}>
            {incident.event_name} · {incident.tenant_name} · Logged {formatDateTime(incident.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: details + lifecycle */}
        <div className="lg:col-span-2 space-y-4">

          {/* Status lifecycle */}
          <div className="card-sm">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F0F14', marginBottom: 16 }}>Incident Lifecycle</h3>
            <div className="flex items-center gap-0">
              {STATUSES.map((s, i) => {
                const done = i <= currentStatusIdx
                const active = s === incident.status
                const sColor = STATUS_COLORS[s]
                return (
                  <React.Fragment key={s}>
                    <button
                      onClick={() => !active && updateMut.mutate({ status: s })}
                      disabled={updateMut.isPending}
                      className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all flex-1"
                      style={{
                        background: active ? sColor.bg : done ? 'rgba(0,0,0,0.03)' : 'transparent',
                        border: active ? `1px solid ${sColor.border}` : '1px solid transparent',
                        opacity: i > currentStatusIdx + 1 ? 0.4 : 1,
                        cursor: active ? 'default' : 'pointer',
                      }}
                    >
                      <div className="h-6 w-6 rounded-full flex items-center justify-center"
                        style={{ background: done ? sColor.color : '#E5E7EB' }}>
                        {done ? <CheckCircle size={13} color="white" /> : <span style={{ fontSize: 10, color: '#9CA3AF' }}>{i+1}</span>}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: active ? sColor.color : '#9CA3AF', whiteSpace: 'nowrap' }}>
                        {STATUS_LABELS[s]}
                      </span>
                    </button>
                    {i < STATUSES.length - 1 && (
                      <div style={{ height: 1, flex: '0 0 12px', background: i < currentStatusIdx ? '#E8521A' : '#E5E7EB' }} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
            {incident.status !== 'resolved' && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <button
                  onClick={() => updateMut.mutate({ status: STATUSES[Math.min(currentStatusIdx + 1, STATUSES.length - 1)] })}
                  disabled={updateMut.isPending || incident.status === 'resolved'}
                  className="btn btn-primary btn-sm w-full"
                >
                  Advance to {STATUS_LABELS[STATUSES[Math.min(currentStatusIdx + 1, STATUSES.length - 1)]]}
                </button>
              </div>
            )}
          </div>

          {/* Incident details */}
          <div className="card-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F0F14' }}>Incident Details</h3>
              {!editing ? (
                <button onClick={startEdit} className="btn btn-ghost btn-sm gap-1">
                  <Edit2 size={12} /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => updateMut.mutate(editForm)} disabled={updateMut.isPending}
                    className="btn btn-primary btn-sm gap-1"><Save size={12} /> Save</button>
                  <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm"><X size={12} /></button>
                </div>
              )}
            </div>
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Category</label>
                    <select value={editForm.category ?? ''} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                      className="input-field py-2 text-sm">
                      {['medical','security','crowd_pressure','fire_evacuation','ct_concern','suspicious_behaviour','lost_person','infrastructure','noise_nuisance','near_miss','other'].map(c =>
                        <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Severity</label>
                    <select value={editForm.severity ?? ''} onChange={e => setEditForm(f => ({ ...f, severity: e.target.value }))}
                      className="input-field py-2 text-sm">
                      {['critical','high','medium','low'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label text-xs">Location / Zone</label>
                  <input value={editForm.location_zone ?? ''} onChange={e => setEditForm(f => ({ ...f, location_zone: e.target.value }))}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="label text-xs">Description</label>
                  <textarea value={editForm.description ?? ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    className="input-field text-sm" rows={4} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {[
                    { label: 'Category',    value: incident.category?.replace(/_/g,' ') },
                    { label: 'Severity',    value: incident.severity ?? '—' },
                    { label: 'Location',    value: incident.location_zone ?? '—' },
                    { label: 'Logged by',   value: incident.logged_by_name ?? '—' },
                    { label: 'Logged at',   value: formatDateTime(incident.created_at) },
                    { label: 'Resolved at', value: incident.resolved_at ? formatDateTime(incident.resolved_at) : '—' },
                  ].map(f => (
                    <div key={f.label}>
                      <p style={{ fontSize: 11, color: '#9898AE', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{f.label}</p>
                      <p style={{ fontSize: 13, color: '#0F0F14', marginTop: 2, textTransform: 'capitalize' }}>{f.value}</p>
                    </div>
                  ))}
                </div>
                {incident.description && (
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12 }}>
                    <p style={{ fontSize: 11, color: '#9898AE', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>Description</p>
                    <p style={{ fontSize: 13, color: '#0F0F14', lineHeight: 1.6 }}>{incident.description}</p>
                  </div>
                )}
                {incident.photo_url && (
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12 }}>
                    <p style={{ fontSize: 11, color: '#9898AE', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>Photo Evidence</p>
                    <img src={incident.photo_url} alt="Evidence" className="rounded-xl" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resolution (show when not resolved) */}
          {incident.status !== 'resolved' && (
            <div className="card-sm" style={{ border: '1px solid rgba(34,197,94,0.2)', background: '#F0FDF4' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#15803D', marginBottom: 12 }}>
                <CheckCircle size={14} className="inline mr-1.5" />
                Resolve Incident
              </h3>
              <textarea
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                placeholder="Enter resolution notes (what was done, outcome)..."
                className="input-field text-sm mb-3" rows={3}
              />
              <button onClick={handleResolve} disabled={updateMut.isPending}
                className="btn btn-sm w-full font-bold"
                style={{ background: '#16A34A', color: 'white' }}>
                Mark as Resolved
              </button>
            </div>
          )}

          {incident.resolution_notes && (
            <div className="card-sm" style={{ background: '#F0FDF4', border: '1px solid rgba(34,197,94,0.2)' }}>
              <p style={{ fontSize: 11, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>
                Resolution Notes
              </p>
              <p style={{ fontSize: 13, color: '#15803D', lineHeight: 1.6 }}>{incident.resolution_notes}</p>
            </div>
          )}

          {/* Action timeline */}
          <div className="card-sm">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F0F14', marginBottom: 16 }}>Action Timeline</h3>
            {actions.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9898AE' }}>No actions logged yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px" style={{ background: 'rgba(0,0,0,0.06)' }} />
                <div className="space-y-4">
                  {[...actions]
                    .sort((a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime())
                    .map(a => (
                      <div key={a.id} className="flex gap-4 pl-8 relative">
                        <div className="absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center"
                          style={{ background: '#E8521A' }}>
                          <Clock size={11} color="white" />
                        </div>
                        <div className="flex-1 pb-1">
                          <p style={{ fontSize: 13, color: '#0F0F14' }}>{a.action_text}</p>
                          <p style={{ fontSize: 11, color: '#9898AE', marginTop: 2 }}>
                            {a.actor_name && <span className="font-semibold" style={{ color: '#E8521A' }}>{a.actor_name} · </span>}
                            {formatDateTime(a.performed_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 flex gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <input
                value={actionText}
                onChange={e => setActionText(e.target.value)}
                placeholder="Log an action taken..."
                className="input-field text-sm flex-1"
                style={{ minHeight: 38 }}
                onKeyDown={e => { if (e.key === 'Enter' && actionText.trim()) logActionMut.mutate(actionText) }}
              />
              <button
                onClick={() => actionText.trim() && logActionMut.mutate(actionText)}
                disabled={!actionText.trim() || logActionMut.isPending}
                className="btn btn-primary btn-sm px-4">
                Log
              </button>
            </div>
          </div>

        </div>

        {/* Right: assignment + meta */}
        <div className="space-y-4">

          {/* Assignment */}
          <div className="card-sm">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F0F14', marginBottom: 12 }}>Assignment</h3>
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl"
              style={{ background: incident.assigned_to ? 'rgba(232,82,26,0.05)' : 'rgba(0,0,0,0.03)' }}>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: incident.assigned_to ? 'rgba(232,82,26,0.1)' : '#E5E7EB', color: incident.assigned_to ? '#E8521A' : '#9CA3AF' }}>
                {incident.assigned_to_name?.[0] ?? <User size={16} />}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0F0F14' }}>
                  {incident.assigned_to_name ?? 'Unassigned'}
                </p>
                <p style={{ fontSize: 11, color: '#9898AE' }}>Assigned responder</p>
              </div>
            </div>
            <select
              defaultValue=""
              onChange={e => e.target.value && updateMut.mutate({ assigned_to: e.target.value, status: incident.status === 'logged' ? 'assigned' : incident.status })}
              className="input-field text-sm"
            >
              <option value="">Reassign to...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}
            </select>
          </div>

          {/* Quick actions */}
          <div className="card-sm">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F0F14', marginBottom: 12 }}>Quick Actions</h3>
            <div className="space-y-2">
              {incident.status !== 'in_progress' && incident.status !== 'resolved' && (
                <button onClick={() => updateMut.mutate({ status: 'in_progress' })} disabled={updateMut.isPending}
                  className="w-full btn btn-sm font-medium" style={{ background: 'rgba(232,82,26,0.08)', color: '#E8521A', border: '1px solid rgba(232,82,26,0.2)' }}>
                  Mark In Progress
                </button>
              )}
              {incident.status !== 'resolved' && (
                <button onClick={handleResolve} disabled={updateMut.isPending}
                  className="w-full btn btn-sm font-medium flex items-center justify-center gap-1.5" style={{ background: 'rgba(34,197,94,0.08)', color: '#16A34A', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <CheckCircle size={13} /> Mark Resolved
                </button>
              )}
              {incident.severity !== 'critical' && (
                <button onClick={() => updateMut.mutate({ severity: 'critical' })} disabled={updateMut.isPending}
                  className="w-full btn btn-sm font-medium flex items-center justify-center gap-1.5" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}>
                  <AlertTriangle size={13} /> Escalate to Critical
                </button>
              )}
            </div>
          </div>

          {/* Linked event */}
          <div className="card-sm">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F0F14', marginBottom: 12 }}>Linked Event</h3>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F0F14' }}>{incident.event_name ?? '—'}</p>
            <p style={{ fontSize: 12, color: '#9898AE', marginTop: 2 }}>{incident.tenant_name}</p>
            {incident.event_id && (
              <Link to={`/client/events/${incident.event_id}`}
                className="mt-3 flex items-center gap-1 text-xs font-semibold hover:underline"
                style={{ color: '#E8521A' }}>
                Open event <ArrowUpRight size={12} />
              </Link>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
