import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart2, Download, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { api } from '../../lib/api'
import type { TideEvent, EventStats } from '../../types'
import { PRIORITY_COLORS } from '../../types'

function StatCard({ label, value, color, icon: Icon }: { label: string; value: string | number; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center justify-center rounded-xl" style={{ background: `${color}15`, width: 40, height: 40 }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-white/40 text-xs uppercase tracking-wider mt-1 font-semibold">{label}</p>
    </div>
  )
}

export function LiveReports() {
  const { data: events = [] } = useQuery({
    queryKey: ['live-events'],
    queryFn: () => api.get<TideEvent[]>('/events?status=live'),
  })
  const liveEvent = events[0] ?? null

  const { data: stats } = useQuery({
    queryKey: ['live-stats', liveEvent?.id],
    queryFn: () => liveEvent ? api.get<EventStats>(`/stats?event_id=${liveEvent.id}`) : null,
    enabled: !!liveEvent,
    refetchInterval: 30000,
  })

  if (!liveEvent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/20 p-8">
        <BarChart2 size={48} className="mb-4" />
        <p className="text-sm">No live event — reports unavailable</p>
      </div>
    )
  }

  const resRate = stats && stats.totalIncidents > 0
    ? Math.round((stats.resolvedIncidents / stats.totalIncidents) * 100)
    : 0

  const maxCategory = stats ? Math.max(...(stats.byCategory?.map(b => b.count) ?? [1])) : 1

  const trend = stats?.trend7d ?? []
  const maxTrend = Math.max(...trend.map(t => t.count), 1)

  return (
    <div className="flex flex-col h-full overflow-auto p-5" style={{ background: '#0A0B0F' }}>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-bold text-xl">Event Reports</h1>
          <p className="text-white/40 text-xs mt-0.5">{liveEvent.name}</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Incidents" value={stats?.totalIncidents ?? 0} color="#5B8CFF" icon={BarChart2} />
        <StatCard label="Open" value={stats?.openIncidents ?? 0} color="#FF9500" icon={AlertTriangle} />
        <StatCard label="Resolution Rate" value={`${resRate}%`} color="#34C759" icon={CheckCircle} />
        <StatCard label="Avg Resolution" value={stats ? `${stats.avgResolutionMin}m` : '—'} color="#4ECDC4" icon={Clock} />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">

        {/* By Priority */}
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4">By Priority</p>
          <div className="space-y-3">
            {(['P1','P2','P3','P4','P5'] as const).map(p => {
              const count = stats?.byPriority?.[p] ?? 0
              const max = Math.max(...Object.values(stats?.byPriority ?? {}), 1)
              const c = PRIORITY_COLORS[p]
              return (
                <div key={p} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-bold" style={{ color: c.bg }}>{p}</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(count / max) * 100}%`, background: c.bg }} />
                  </div>
                  <span className="w-8 text-right text-white font-bold text-sm">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Status */}
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4">By Status</p>
          <div className="space-y-3">
            {Object.entries(stats?.byStatus ?? {}).map(([status, count]) => {
              const max = Math.max(...Object.values(stats?.byStatus ?? {}), 1)
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-white/40 capitalize truncate">{status.replace(/_/g,' ')}</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, background: '#E8521A' }} />
                  </div>
                  <span className="w-8 text-right text-white font-bold text-sm">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Category */}
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4">By Category</p>
          <div className="space-y-3">
            {(stats?.byCategory ?? []).map(({ category, count }) => (
              <div key={category} className="flex items-center gap-3">
                <span className="w-28 text-xs text-white/40 capitalize truncate">{category.replace(/_/g,' ')}</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(count / maxCategory) * 100}%`, background: '#5B8CFF' }} />
                </div>
                <span className="w-8 text-right text-white font-bold text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7-day trend */}
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4">7-Day Trend</p>
          <div className="flex items-end gap-2 h-32">
            {trend.length === 0 ? (
              <p className="text-white/20 text-xs m-auto">No data</p>
            ) : trend.map(({ day, count }) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-white/30 text-xs">{count}</span>
                <div className="w-full rounded-t" style={{ height: `${(count / maxTrend) * 100}%`, minHeight: 4, background: 'rgba(232,82,26,0.6)' }} />
                <span className="text-white/20 text-xs">{new Date(day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
