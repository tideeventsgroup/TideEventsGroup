import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Filter, Download, RefreshCw, AlertTriangle,
  Clock, MapPin, Users, ChevronRight, CheckCircle
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import type { TideEvent, Incident, IncidentPriority, IncidentStatus } from '../../types'
import { PRIORITY_COLORS, STATUS_COLORS, PRIORITY_LABELS } from '../../types'

const PRIORITIES: IncidentPriority[] = ['P1','P2','P3','P4','P5']
const STATUSES: IncidentStatus[] = ['new','assigned','en_route','on_scene','resolved','closed']
const CATEGORIES = ['security','medical','safety','welfare','infrastructure','environmental','other']

function PriorityPill({ priority }: { priority: IncidentPriority }) {
  const c = PRIORITY_COLORS[priority]
  return (
    <span className="inline-flex items-center justify-center rounded font-bold text-xs px-1.5 py-0.5"
      style={{ background: c.bg, color: c.text, minWidth: 32 }}>
      {priority}
    </span>
  )
}

function StatusPill({ status }: { status: IncidentStatus }) {
  const c = STATUS_COLORS[status] ?? { bg: 'rgba(99,99,102,0.15)', text: '#636366' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}>
      {status.replace(/_/g,' ')}
    </span>
  )
}

function IncidentAge({ createdAt }: { createdAt: string }) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  const txt = mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`
  return <span className="text-white/30 text-xs">{txt}</span>
}

export function LiveIncidents() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const canCreate = user && ['silver_command','incident_manager','cad_operator','event_manager','super_admin'].includes(user.role)
  const canUpdate = user && ['silver_command','incident_manager','cad_operator','operations_manager','super_admin'].includes(user.role)

  const { data: events = [] } = useQuery({
    queryKey: ['live-events'],
    queryFn: () => api.get<TideEvent[]>('/events?status=live'),
  })
  const liveEvent = events[0] ?? null

  const params = new URLSearchParams()
  if (liveEvent) params.set('event_id', liveEvent.id)
  if (filterPriority) params.set('priority', filterPriority)
  if (filterStatus) params.set('status', filterStatus)
  if (filterCategory) params.set('category', filterCategory)
  if (search) params.set('search', search)
  params.set('limit', '200')

  const { data: incidents = [], isLoading, refetch } = useQuery({
    queryKey: ['incidents', params.toString()],
    queryFn: () => api.get<Incident[]>(`/incidents?${params}`),
    refetchInterval: 15000,
  })

  const bulkResolveMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => api.patch(`/incidents/${id}`, { status: 'resolved' }))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); setSelected(new Set()) },
  })

  function exportCSV() {
    const header = ['CAD#','Priority','Type','Category','Status','Zone','Logged By','Assigned To','Created','Resolved']
    const rows = incidents.map(i => [
      i.cad_number ?? '', i.priority, i.incident_type ?? '', i.category, i.status,
      i.location_zone ?? '', i.logged_by_name ?? '', i.assigned_to_name ?? '',
      i.created_at, i.resolved_at ?? '',
    ])
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `incidents-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  function toggleSelect(id: string) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const open = incidents.filter(i => !['resolved','closed'].includes(i.status))
  const resolved = incidents.filter(i => ['resolved','closed'].includes(i.status))

  return (
    <div className="flex flex-col h-full" style={{ background: '#0A0B0F' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h1 className="text-white font-bold text-lg">Incident Management</h1>
          <p className="text-white/30 text-xs">{open.length} open · {resolved.length} resolved · {incidents.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="text-white/30 hover:text-white/70 transition-colors p-2">
            <RefreshCw size={14} />
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <Download size={13} /> Export CSV
          </button>
          {selected.size > 0 && canUpdate && (
            <button
              onClick={() => bulkResolveMutation.mutate(Array.from(selected))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white"
              style={{ background: 'rgba(52,199,89,0.2)', color: '#34C759', border: '1px solid rgba(52,199,89,0.3)' }}>
              <CheckCircle size={13} /> Resolve {selected.size}
            </button>
          )}
          {canCreate && (
            <Link to="/live/incidents/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white"
              style={{ background: '#E8521A' }}>
              <Plus size={14} /> New Incident
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search CAD#, description, zone…"
            className="w-full pl-8 pr-3 py-2 rounded-lg text-xs text-white placeholder-white/20 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center pt-12"><LoadingSpinner /></div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/20">
            <AlertTriangle size={32} className="mb-3" />
            <p className="text-sm">No incidents found</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="px-4 py-2.5 text-left">
                  <input type="checkbox"
                    checked={selected.size === incidents.length && incidents.length > 0}
                    onChange={e => setSelected(e.target.checked ? new Set(incidents.map(i => i.id)) : new Set())}
                    className="accent-orange-500" />
                </th>
                {['Priority','CAD #','Type / Category','Status','Location','Logged By','Assigned','Age',''].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider"
                    style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidents.map(incident => {
                const pc = PRIORITY_COLORS[incident.priority]
                return (
                  <tr
                    key={incident.id}
                    onClick={() => navigate(`/live/incidents/${incident.id}`)}
                    className="cursor-pointer hover:bg-white/3 transition-colors"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      borderLeft: `2px solid ${pc.bg}`,
                    }}>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(incident.id)}
                        onChange={() => toggleSelect(incident.id)} className="accent-orange-500" />
                    </td>
                    <td className="px-3 py-3"><PriorityPill priority={incident.priority} /></td>
                    <td className="px-3 py-3 font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {incident.cad_number}
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-white font-semibold capitalize">
                        {incident.incident_type?.replace(/_/g,' ') ?? '—'}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.3)' }} className="capitalize">{incident.category}</p>
                    </td>
                    <td className="px-3 py-3"><StatusPill status={incident.status} /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        <MapPin size={10} />
                        <span className="max-w-28 truncate">{incident.location_zone ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {incident.logged_by_name ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      {incident.assigned_to_name ? (
                        <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          <Users size={10} />
                          {incident.assigned_to_name}
                        </div>
                      ) : <span style={{ color: 'rgba(255,255,255,0.2)' }}>Unassigned</span>}
                    </td>
                    <td className="px-3 py-3"><IncidentAge createdAt={incident.created_at} /></td>
                    <td className="px-3 py-3">
                      <ChevronRight size={14} className="text-white/20" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
