import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart2, AlertTriangle, Users, FileText, TrendingUp, CheckCircle, Clock, Download } from 'lucide-react'
import { api } from '../../lib/api'
import type { TideEvent, Risk } from '../../types'

interface EventStats {
  totalIncidents: number
  openIncidents: number
  resolvedIncidents: number
  avgResolutionMin: number
  byPriority?: Record<string, number>
  byCategory?: { category: string; count: number }[]
  byStatus?: Record<string, number>
}

interface Contractor {
  id: string
  type: string
  headcount: number
  archived: boolean
}

function StatTile({ label, value, color, icon: Icon, sub }: { label: string; value: string | number; color: string; icon: React.ElementType; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center justify-center rounded-xl" style={{ background: `${color}12`, width: 36, height: 36 }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-black" style={{ color, letterSpacing: '-0.03em' }}>{value}</p>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-300 mt-0.5">{sub}</p>}
    </div>
  )
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-xs text-gray-500 capitalize truncate">{label.replace(/_/g,' ')}</span>
      <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, background: color }} />
      </div>
      <span className="w-8 text-right font-bold text-gray-700 text-sm">{value}</span>
    </div>
  )
}

const PRIORITY_COLORS: Record<string, string> = { P1: '#FF3B30', P2: '#FF6B35', P3: '#FF9500', P4: '#FFCC00', P5: '#34C759' }
const CATEGORY_COLORS: Record<string, string> = { security: '#FF9500', medical: '#FF3B30', safety: '#FF6B35', welfare: '#5AC8FA', infrastructure: '#FFCC00' }

export function PlanningReports() {
  const [selectedEvent, setSelectedEvent] = useState('')

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => api.get<TideEvent[]>('/events') })
  const activeEvent = selectedEvent || events.find(e => e.status !== 'closed')?.id || ''
  const event = events.find(e => e.id === activeEvent)

  const { data: stats } = useQuery<EventStats | null>({
    queryKey: ['planning-stats', activeEvent],
    queryFn: () => activeEvent ? api.get<EventStats>(`/stats?event_id=${activeEvent}`) : null,
    enabled: !!activeEvent,
  })

  const { data: risks = [] } = useQuery<Risk[]>({
    queryKey: ['risks', activeEvent],
    queryFn: () => api.get<Risk[]>(`/risks?event_id=${activeEvent}`),
    enabled: !!activeEvent,
  })

  const { data: contractors = [] } = useQuery<Contractor[]>({
    queryKey: ['contractors', activeEvent],
    queryFn: () => api.get<Contractor[]>(`/contractors?event_id=${activeEvent}`),
    enabled: !!activeEvent,
  })

  const activeContractors = contractors.filter(c => !c.archived)
  const totalHeadcount = activeContractors.reduce((s, c) => s + (c.headcount ?? 0), 0)

  const highRisks   = risks.filter(r => (r.risk_score ?? 0) >= 15).length
  const mediumRisks = risks.filter(r => { const s = r.risk_score ?? 0; return s >= 8 && s < 15 }).length
  const lowRisks    = risks.filter(r => (r.risk_score ?? 0) < 8).length

  const resolutionRate = stats && stats.totalIncidents > 0
    ? Math.round((stats.resolvedIncidents / stats.totalIncidents) * 100)
    : 0

  const maxPriority   = Math.max(...Object.values(stats?.byPriority ?? {}), 1)
  const maxCategory   = Math.max(...(stats?.byCategory ?? []).map(b => b.count), 1)
  const maxStatus     = Math.max(...Object.values(stats?.byStatus ?? {}), 1)

  function exportCSV() {
    const rows = [
      ['TIDE Planning Report'],
      ['Event', event?.name ?? ''],
      ['Date', new Date().toLocaleDateString('en-GB')],
      [],
      ['INCIDENTS'],
      ['Total', stats?.totalIncidents ?? 0],
      ['Open', stats?.openIncidents ?? 0],
      ['Resolved', stats?.resolvedIncidents ?? 0],
      ['Resolution Rate', `${resolutionRate}%`],
      ['Avg Resolution (min)', stats?.avgResolutionMin ?? 0],
      [],
      ['RISKS'],
      ['High (≥15)', highRisks],
      ['Medium (8–14)', mediumRisks],
      ['Low (<8)', lowRisks],
      [],
      ['RESOURCES'],
      ['Contractors', activeContractors.length],
      ['Total Headcount', totalHeadcount],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `tide-planning-report-${event?.name?.replace(/\s+/g,'-') ?? 'event'}.csv`
    a.click()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900" style={{ letterSpacing: '-0.03em' }}>Planning Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Event readiness summary and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none bg-white">
            <option value="">Select Event</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-gray-600 text-sm border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {!activeEvent ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-300">
          <BarChart2 size={48} className="mb-3" />
          <p className="text-gray-400">Select an event to view its report</p>
        </div>
      ) : (
        <>
          {/* Event info banner */}
          {event && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-gray-900 text-lg">{event.name}</h2>
                <p className="text-gray-500 text-sm mt-0.5">{event.venue_name} · {event.start_date ? new Date(event.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBC'}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-sm font-bold capitalize"
                style={{ background: event.status === 'live' ? 'rgba(52,199,89,0.1)' : 'rgba(91,140,255,0.1)', color: event.status === 'live' ? '#34C759' : '#5B8CFF' }}>
                {event.status.replace(/_/g,' ')}
              </span>
            </div>
          )}

          {/* KPI row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatTile label="Total Incidents" value={stats?.totalIncidents ?? 0} color="#5B8CFF" icon={BarChart2} />
            <StatTile label="Open Incidents"  value={stats?.openIncidents ?? 0}  color="#FF9500" icon={AlertTriangle} />
            <StatTile label="Resolution Rate" value={`${resolutionRate}%`}        color="#34C759" icon={CheckCircle} />
            <StatTile label="Avg Resolution"  value={stats ? `${stats.avgResolutionMin}m` : '—'} color="#4ECDC4" icon={Clock} />
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5">

            {/* Incidents by Priority */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Incidents by Priority</p>
              <div className="space-y-3">
                {(['P1','P2','P3','P4','P5'] as const).map(p => (
                  <ProgressBar key={p} label={p} value={stats?.byPriority?.[p] ?? 0} max={maxPriority} color={PRIORITY_COLORS[p]} />
                ))}
              </div>
            </div>

            {/* Incidents by Category */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Incidents by Category</p>
              <div className="space-y-3">
                {(stats?.byCategory ?? []).length > 0
                  ? (stats!.byCategory!).map(({ category, count }) => (
                    <ProgressBar key={category} label={category} value={count} max={maxCategory} color={CATEGORY_COLORS[category] ?? '#636366'} />
                  ))
                  : <p className="text-gray-300 text-sm">No incident data</p>
                }
              </div>
            </div>

            {/* Risk Register Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Risk Register Summary</p>
              <div className="space-y-3 mb-4">
                <ProgressBar label="High Risk (≥15)" value={highRisks}   max={Math.max(highRisks, mediumRisks, lowRisks, 1)} color="#FF3B30" />
                <ProgressBar label="Medium (8–14)"   value={mediumRisks} max={Math.max(highRisks, mediumRisks, lowRisks, 1)} color="#FF9500" />
                <ProgressBar label="Low (<8)"         value={lowRisks}   max={Math.max(highRisks, mediumRisks, lowRisks, 1)} color="#34C759" />
              </div>
              {highRisks > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,59,48,0.06)' }}>
                  <AlertTriangle size={14} style={{ color: '#FF3B30' }} />
                  <p className="text-xs font-semibold" style={{ color: '#FF3B30' }}>{highRisks} high-risk item{highRisks > 1 ? 's' : ''} require attention</p>
                </div>
              )}
            </div>

            {/* Resource Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Resource Plan Summary</p>
              {activeContractors.length === 0 ? (
                <p className="text-gray-300 text-sm">No contractors added yet</p>
              ) : (
                <div className="space-y-2">
                  {activeContractors.map(c => (
                    <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-600 capitalize">{c.type.replace(/_/g,' ')}</span>
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-gray-400" />
                        <span className="font-bold text-gray-800 text-sm">{c.headcount}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-bold text-gray-700">Total Headcount</span>
                    <span className="font-black text-lg" style={{ color: '#E8521A' }}>{totalHeadcount}</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Event Readiness Checklist */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-gray-400" />
              <h2 className="font-bold text-gray-900">Event Readiness Checklist</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Event details complete', done: !!(event?.venue_name && event?.start_date) },
                { label: 'Risk register populated', done: risks.length > 0 },
                { label: 'High risks reviewed', done: highRisks === 0 },
                { label: 'Contractors assigned', done: activeContractors.length > 0 },
                { label: 'Staff headcount confirmed', done: totalHeadcount > 0 },
                { label: 'Incident tracking active', done: (stats?.totalIncidents ?? 0) >= 0 },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center justify-center rounded-full"
                    style={{ width: 22, height: 22, background: done ? 'rgba(52,199,89,0.1)' : 'rgba(99,99,102,0.08)' }}>
                    {done ? <CheckCircle size={13} style={{ color: '#34C759' }} /> : <Clock size={11} className="text-gray-300" />}
                  </div>
                  <span className="text-sm" style={{ color: done ? '#111827' : '#9CA3AF' }}>{label}</span>
                  <span className="ml-auto text-xs font-semibold" style={{ color: done ? '#34C759' : '#9CA3AF' }}>
                    {done ? 'Complete' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
