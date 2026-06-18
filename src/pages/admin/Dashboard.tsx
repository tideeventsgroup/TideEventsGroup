import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Calendar, AlertTriangle, ClipboardCheck, TrendingUp, ArrowUpRight, Activity } from 'lucide-react'
import { api } from '../../lib/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { StatusBadge } from '../../components/ui/Badge'
import { formatDateTime } from '../../lib/utils'

interface Stats {
  totalClients: number
  activeEvents: number
  liveIncidents: number
  pendingActions: number
}

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<Stats>('/stats'),
  })
  const { data: recentAudit = [], isLoading: auditLoading } = useQuery({
    queryKey: ['audit-recent'],
    queryFn: () => api.get<Record<string, unknown>[]>('/audit?limit=8'),
  })
  const { data: recentTenants = [] } = useQuery({
    queryKey: ['tenants-recent'],
    queryFn: () => api.get<Record<string, unknown>[]>('/tenants'),
  })

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const kpis = [
    {
      label: 'Total Clients',
      value: stats?.totalClients ?? 0,
      icon: Building2,
      gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      accent: '#5B8CFF',
      iconBg: 'rgba(91,140,255,0.1)',
    },
    {
      label: 'Live Events Today',
      value: stats?.activeEvents ?? 0,
      icon: Calendar,
      gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 100%)',
      accent: '#4ECDC4',
      iconBg: 'rgba(78,205,196,0.1)',
    },
    {
      label: 'Open Incidents',
      value: stats?.liveIncidents ?? 0,
      icon: AlertTriangle,
      gradient: 'linear-gradient(135deg, #1a0a0a 0%, #2d1010 100%)',
      accent: '#FF3B30',
      iconBg: 'rgba(255,59,48,0.1)',
      alert: (stats?.liveIncidents ?? 0) > 0,
    },
    {
      label: 'Pending Actions',
      value: stats?.pendingActions ?? 0,
      icon: ClipboardCheck,
      gradient: 'linear-gradient(135deg, #1a1200 0%, #2d2000 100%)',
      accent: '#FF9500',
      iconBg: 'rgba(255,149,0,0.1)',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F0F14', letterSpacing: '-0.03em' }}>
            Operations Overview
          </h1>
          <p style={{ fontSize: 13, color: '#9898AE', marginTop: 4 }}>{today}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.15)' }}>
          <span className="h-2 w-2 rounded-full live-dot" style={{ background: '#34C759' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#34C759' }}>Systems operational</span>
        </div>
      </div>

      {/* KPI grid */}
      {statsLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
          {kpis.map(kpi => (
            <div
              key={kpi.label}
              className={`rounded-2xl p-5 relative overflow-hidden ${kpi.alert ? 'critical-pulse' : ''}`}
              style={{ background: kpi.gradient, border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="flex items-center justify-center rounded-xl mb-4"
                style={{ background: kpi.iconBg, width: 40, height: 40 }}
              >
                <kpi.icon size={18} style={{ color: kpi.accent }} />
              </div>
              <div style={{ fontSize: 40, fontWeight: 800, color: kpi.accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {kpi.value}
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
                {kpi.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bento grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* Clients — spans 3 cols */}
        <div className="xl:col-span-3 card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center rounded-lg" style={{ background: 'rgba(91,140,255,0.08)', width: 32, height: 32 }}>
                <Building2 size={15} style={{ color: '#5B8CFF' }} />
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F0F14' }}>Active Clients</h2>
            </div>
            <a href="/admin/clients" className="flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: '#E8521A' }}>
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          {recentTenants.length > 0 ? (
            <div className="space-y-1">
              {recentTenants.slice(0, 6).map((t: Record<string, unknown>) => (
                <a
                  key={t.id as string}
                  href={`/admin/clients/${t.id}`}
                  className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-[var(--surface-2)]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center rounded-lg font-bold text-xs"
                      style={{ background: 'rgba(232,82,26,0.08)', color: '#E8521A', width: 32, height: 32 }}
                    >
                      {(t.name as string)?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F0F14' }}>{t.name as string}</p>
                      <p style={{ fontSize: 11, color: '#9898AE', marginTop: 1, textTransform: 'capitalize' }}>
                        {(t.type as string)?.replace(/_/g, ' ') ?? '—'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={t.status as string} />
                </a>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Building2 size={32} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No clients yet</p>
            </div>
          )}
        </div>

        {/* Activity — spans 2 cols */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center rounded-lg" style={{ background: 'rgba(78,205,196,0.08)', width: 32, height: 32 }}>
                <Activity size={15} style={{ color: '#4ECDC4' }} />
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F0F14' }}>Recent Activity</h2>
            </div>
            <a href="/admin/audit" className="flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: '#E8521A' }}>
              Audit log <ArrowUpRight size={12} />
            </a>
          </div>
          {auditLoading ? <LoadingSpinner className="h-24" /> : (
            recentAudit.length > 0 ? (
              <div className="space-y-3">
                {recentAudit.map((log: Record<string, unknown>, i) => (
                  <div key={log.id as string} className="flex items-start gap-3">
                    <div
                      className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                      style={{ background: `hsl(${(i * 47) % 360}, 60%, 94%)`, width: 28, height: 28 }}
                    >
                      <TrendingUp size={11} style={{ color: `hsl(${(i * 47) % 360}, 55%, 45%)` }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#0F0F14' }}>{log.action as string}</p>
                      <p style={{ fontSize: 11, color: '#9898AE', marginTop: 1 }}>{formatDateTime(log.created_at as string)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <ClipboardCheck size={32} className="text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No recent activity</p>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  )
}
