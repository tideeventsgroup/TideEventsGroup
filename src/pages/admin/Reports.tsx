import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, TrendingUp, AlertTriangle, CheckCircle, Clock, BarChart2 } from 'lucide-react'
import { api } from '../../lib/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

interface Stats {
  totalClients: number
  activeEvents: number
  liveIncidents: number
  avgResolutionMin: number
  bySeverity: Record<string, number>
  byStatus:   Record<string, number>
  byCategory: { category: string; count: number }[]
  trend7d:    { day: string; count: number }[]
}

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3 mb-2.5">
      <span style={{ fontSize: 12, color: '#5C5C6E', width: 150, flexShrink: 0, textTransform: 'capitalize' }}>
        {label.replace(/_/g, ' ')}
      </span>
      <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
        <div className="h-5 rounded-full flex items-center px-2 transition-all duration-700"
          style={{ width: `${Math.max(pct, 3)}%`, background: color, minWidth: 28 }}>
          <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>{value}</span>
        </div>
      </div>
    </div>
  )
}

function MiniSparkline({ data }: { data: { day: string; count: number }[] }) {
  if (!data.length) return <div style={{ height: 48, color: '#9898AE', fontSize: 12, display: 'flex', alignItems: 'center' }}>No data</div>
  const max = Math.max(...data.map(d => d.count), 1)
  const w = 280; const h = 48
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * w
    const y = h - (d.count / max) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke="#E8521A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        points={pts} />
      {data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * w
        const y = h - (d.count / max) * h
        return <circle key={i} cx={x} cy={y} r="3.5" fill="#E8521A" />
      })}
    </svg>
  )
}

function formatMin(min: number) {
  if (min < 60) return `${min}m`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

export function Reports() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<Stats>('/stats'),
  })

  const { data: incidents = [] } = useQuery<Record<string, unknown>[]>({
    queryKey: ['admin-incidents-all'],
    queryFn: () => api.get<Record<string, unknown>[]>('/incidents'),
  })

  function exportCsv() {
    const rows = incidents.map(i => [
      i.reference_number, i.created_at, i.event_name, i.tenant_name,
      i.category, i.severity, i.status, i.resolved_at ?? ''
    ])
    const headers = ['Ref','Created','Event','Client','Category','Severity','Status','Resolved At']
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `incident-report-${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  if (isLoading || !stats) return <LoadingSpinner />

  const totalIncidents = Object.values(stats.byStatus).reduce((a, b) => a + b, 0)
  const resolved       = stats.byStatus['resolved'] ?? 0
  const resolutionRate = totalIncidents > 0 ? Math.round((resolved / totalIncidents) * 100) : 0

  const sevColors: Record<string, string> = { critical: '#FF3B30', high: '#FF9500', medium: '#FFCC00', low: '#34C759' }
  const statusColors: Record<string, string> = { logged: '#9CA3AF', assigned: '#3B82F6', in_progress: '#E8521A', resolved: '#22C55E' }
  const maxSev  = Math.max(...Object.values(stats.bySeverity ?? {}), 1)
  const maxStat = Math.max(...Object.values(stats.byStatus  ?? {}), 1)
  const maxCat  = Math.max(...(stats.byCategory?.map(c => c.count) ?? []), 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Analytics & Reports</h1>
          <p className="page-subtitle">Incident trends, response metrics, and performance data</p>
        </div>
        <button onClick={exportCsv} className="btn btn-outline btn-sm gap-1.5">
          <Download size={13} /> Export All CSV
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Incidents',  value: totalIncidents,        icon: AlertTriangle, color: '#E8521A', bg: 'rgba(232,82,26,0.08)' },
          { label: 'Resolution Rate',  value: `${resolutionRate}%`,  icon: CheckCircle,   color: '#16A34A', bg: 'rgba(34,197,94,0.08)' },
          { label: 'Currently Open',   value: stats.liveIncidents,   icon: TrendingUp,    color: '#2563EB', bg: 'rgba(59,130,246,0.08)' },
          { label: 'Avg Resolution',   value: stats.avgResolutionMin > 0 ? formatMin(stats.avgResolutionMin) : '—',
            icon: Clock, color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
        ].map(kpi => (
          <div key={kpi.label} className="card-sm flex items-start gap-3">
            <div className="flex items-center justify-center rounded-xl h-10 w-10 flex-shrink-0" style={{ background: kpi.bg }}>
              <kpi.icon size={18} style={{ color: kpi.color }} />
            </div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#0F0F14', lineHeight: 1 }}>{kpi.value}</p>
              <p style={{ fontSize: 11, color: '#9898AE', marginTop: 4, fontWeight: 600 }}>{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 7-day trend */}
      <div className="card mb-5">
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F0F14', marginBottom: 16 }}>
          <BarChart2 size={16} className="inline mr-2" style={{ color: '#E8521A' }} />
          Incident Trend — Last 7 Days
        </h2>
        <MiniSparkline data={stats.trend7d ?? []} />
        <div className="flex justify-between mt-2">
          {stats.trend7d?.map(d => (
            <span key={d.day} style={{ fontSize: 10, color: '#9898AE' }}>
              {new Date(d.day).toLocaleDateString('en-GB', { weekday: 'short' })}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* By severity */}
        <div className="card">
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F0F14', marginBottom: 16 }}>By Severity</h2>
          {['critical','high','medium','low'].map(s => (
            <HBar key={s} label={s} value={stats.bySeverity?.[s] ?? 0} max={maxSev} color={sevColors[s]} />
          ))}
        </div>

        {/* By status */}
        <div className="card">
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F0F14', marginBottom: 16 }}>By Status</h2>
          {['logged','assigned','in_progress','resolved'].map(s => (
            <HBar key={s} label={s} value={stats.byStatus?.[s] ?? 0} max={maxStat} color={statusColors[s]} />
          ))}
        </div>

        {/* By category */}
        <div className="card">
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F0F14', marginBottom: 16 }}>By Category</h2>
          {(stats.byCategory ?? []).map(c => (
            <HBar key={c.category} label={c.category} value={c.count} max={maxCat} color="#E8521A" />
          ))}
        </div>

      </div>
    </div>
  )
}
