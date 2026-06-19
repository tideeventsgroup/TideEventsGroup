import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  AlertTriangle, Search, RefreshCw, Download, Eye,
  CheckCircle, X
} from 'lucide-react'
import { api } from '../../lib/api'
import { formatDateTime } from '../../lib/utils'
import type { Tenant } from '../../types'

interface AdminIncident {
  id: string
  reference_number: string
  event_id: string
  tenant_id: string
  category: string
  severity: string | null
  description: string | null
  location_zone: string | null
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

const SEV_STYLE: Record<string, { bg: string; color: string }> = {
  critical: { bg: 'rgba(255,59,48,0.1)',  color: '#FF3B30' },
  high:     { bg: 'rgba(255,149,0,0.1)',  color: '#FF9500' },
  medium:   { bg: 'rgba(255,204,0,0.1)',  color: '#B8900A' },
  low:      { bg: 'rgba(52,199,89,0.1)',  color: '#22A244' },
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  logged:      { bg: 'rgba(156,163,175,0.15)', color: '#6B7280' },
  assigned:    { bg: 'rgba(59,130,246,0.1)',   color: '#2563EB' },
  in_progress: { bg: 'rgba(232,82,26,0.1)',    color: '#E8521A' },
  resolved:    { bg: 'rgba(34,197,94,0.1)',    color: '#16A34A' },
}

function Pill({ value, map }: { value: string; map: Record<string, { bg: string; color: string }> }) {
  const s = map[value] ?? { bg: 'rgba(0,0,0,0.06)', color: '#555' }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}>
      {value.replace(/_/g, ' ')}
    </span>
  )
}

function ageLabel(created_at: string) {
  const mins = Math.floor((Date.now() - new Date(created_at).getTime()) / 60000)
  if (mins < 60)  return `${mins}m`
  if (mins < 1440) return `${Math.floor(mins / 60)}h`
  return `${Math.floor(mins / 1440)}d`
}

function ageColor(created_at: string, status: string) {
  if (status === 'resolved') return '#16A34A'
  const mins = Math.floor((Date.now() - new Date(created_at).getTime()) / 60000)
  if (mins > 120) return '#FF3B30'
  if (mins > 30)  return '#FF9500'
  return '#6B7280'
}

export function AdminIncidents() {
  const navigate    = useNavigate()
  const qc          = useQueryClient()
  const [search, setSearch]         = useState('')
  const [filterSev, setFilterSev]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTenant, setFilterTenant] = useState('')
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')

  const { data: incidents = [], isLoading, refetch } = useQuery<AdminIncident[]>({
    queryKey: ['admin-incidents', filterSev, filterStatus, filterTenant, search],
    queryFn: () => {
      const p = new URLSearchParams()
      if (filterSev)    p.set('severity', filterSev)
      if (filterStatus) p.set('status',   filterStatus)
      if (filterTenant) p.set('tenant_id', filterTenant)
      if (search)       p.set('search',   search)
      return api.get<AdminIncident[]>(`/incidents?${p}`)
    },
    refetchInterval: 30000,
  })

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: () => api.get<Tenant[]>('/tenants'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api.patch(`/incidents/${id}`, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-incidents'] }) },
  })

  const bulkUpdateMut = useMutation({
    mutationFn: async (status: string) => {
      await Promise.all([...selected].map(id => api.patch(`/incidents/${id}`, { status })))
    },
    onSuccess: () => { setSelected(new Set()); qc.invalidateQueries({ queryKey: ['admin-incidents'] }) },
  })

  const stats = useMemo(() => ({
    total:    incidents.length,
    open:     incidents.filter(i => i.status !== 'resolved').length,
    critical: incidents.filter(i => i.severity === 'critical').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
  }), [incidents])

  function exportCsv() {
    const headers = ['Ref','Time','Event','Client','Category','Severity','Status','Assigned To','Location','Age']
    const rows = incidents.map(i => [
      i.reference_number, formatDateTime(i.created_at), i.event_name ?? '', i.tenant_name ?? '',
      i.category, i.severity ?? '', i.status, i.assigned_to_name ?? '', i.location_zone ?? '',
      ageLabel(i.created_at),
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `incidents-${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  function toggleSelect(id: string) {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  const hasFilters = !!(filterSev || filterStatus || filterTenant || search)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Incident Management</h1>
          <p className="page-subtitle">All incidents across all clients and events</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn btn-outline btn-sm gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={exportCsv} className="btn btn-outline btn-sm gap-1.5">
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',    value: stats.total,    color: '#0F0F14' },
          { label: 'Open',     value: stats.open,     color: '#E8521A' },
          { label: 'Critical', value: stats.critical, color: '#FF3B30' },
          { label: 'Resolved', value: stats.resolved, color: '#16A34A' },
        ].map(s => (
          <div key={s.label} className="card-sm text-center">
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#9898AE', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-sm mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ref, event, client, description..."
            className="input-field pl-8 py-2 text-sm"
            style={{ minHeight: 36 }}
          />
        </div>
        <select value={filterSev} onChange={e => setFilterSev(e.target.value)}
          className="input-field py-2 text-sm" style={{ minHeight: 36, width: 140 }}>
          <option value="">All severities</option>
          {['critical','high','medium','low'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="input-field py-2 text-sm" style={{ minHeight: 36, width: 150 }}>
          <option value="">All statuses</option>
          {['logged','assigned','in_progress','resolved'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <select value={filterTenant} onChange={e => setFilterTenant(e.target.value)}
          className="input-field py-2 text-sm" style={{ minHeight: 36, width: 160 }}>
          <option value="">All clients</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setSearch(''); setFilterSev(''); setFilterStatus(''); setFilterTenant('') }}
            className="btn btn-ghost btn-sm gap-1 text-gray-500">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(232,82,26,0.06)', border: '1px solid rgba(232,82,26,0.2)' }}>
          <span className="text-sm font-semibold" style={{ color: '#E8521A' }}>{selected.size} selected</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
            className="input-field py-1.5 text-sm" style={{ minHeight: 32, width: 160 }}>
            <option value="">Change status to...</option>
            {['assigned','in_progress','resolved'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <button
            onClick={() => bulkStatus && bulkUpdateMut.mutate(bulkStatus)}
            disabled={!bulkStatus || bulkUpdateMut.isPending}
            className="btn btn-primary btn-sm">Apply</button>
          <button onClick={() => setSelected(new Set())} className="btn btn-ghost btn-sm ml-auto">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-6 w-6 rounded-full border-2 border-gray-200 border-t-[#E8521A]" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <AlertTriangle size={32} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No incidents found{hasFilters ? ' matching your filters' : ''}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: '#F7F7FA', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <tr>
                  <th className="th w-8">
                    <input type="checkbox"
                      checked={selected.size === incidents.length && incidents.length > 0}
                      onChange={e => setSelected(e.target.checked ? new Set(incidents.map(i => i.id)) : new Set())}
                      className="rounded" />
                  </th>
                  <th className="th">Ref</th>
                  <th className="th">Time / Age</th>
                  <th className="th">Event</th>
                  <th className="th">Client</th>
                  <th className="th">Category</th>
                  <th className="th">Severity</th>
                  <th className="th">Status</th>
                  <th className="th">Assigned</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc, idx) => (
                  <tr key={inc.id}
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}
                    className="hover:bg-[#FFF5F0] transition-colors group"
                  >
                    <td className="td w-8">
                      <input type="checkbox" checked={selected.has(inc.id)}
                        onChange={() => toggleSelect(inc.id)} className="rounded" />
                    </td>
                    <td className="td">
                      <span className="font-mono text-xs font-bold" style={{ color: '#0F0F14' }}>
                        {inc.reference_number ?? '—'}
                      </span>
                    </td>
                    <td className="td whitespace-nowrap">
                      <div style={{ fontSize: 12, color: '#5C5C6E' }}>{formatDateTime(inc.created_at)}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: ageColor(inc.created_at, inc.status) }}>
                        {ageLabel(inc.created_at)} ago
                      </div>
                    </td>
                    <td className="td">
                      <span style={{ fontSize: 13, color: '#0F0F14' }}>{inc.event_name ?? '—'}</span>
                    </td>
                    <td className="td">
                      <span style={{ fontSize: 12, color: '#5C5C6E' }}>{inc.tenant_name ?? '—'}</span>
                    </td>
                    <td className="td">
                      <span className="text-xs capitalize" style={{ color: '#5C5C6E' }}>
                        {inc.category?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="td">
                      {inc.severity ? <Pill value={inc.severity} map={SEV_STYLE} /> : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="td">
                      <Pill value={inc.status} map={STATUS_STYLE} />
                    </td>
                    <td className="td">
                      <span style={{ fontSize: 12, color: inc.assigned_to_name ? '#0F0F14' : '#9898AE' }}>
                        {inc.assigned_to_name ?? 'Unassigned'}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/admin/incidents/${inc.id}`)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                          style={{ background: 'rgba(232,82,26,0.08)', color: '#E8521A' }}
                          title="View detail"
                        >
                          <Eye size={12} /> View
                        </button>
                        {inc.status !== 'resolved' && (
                          <button
                            onClick={() => updateMut.mutate({ id: inc.id, patch: { status: 'resolved' } })}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                            style={{ background: 'rgba(34,197,94,0.08)', color: '#16A34A' }}
                            title="Mark resolved"
                          >
                            <CheckCircle size={12} /> Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2 text-right">{incidents.length} incidents · auto-refreshes every 30s</p>
    </div>
  )
}
