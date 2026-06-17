import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Calendar, AlertTriangle, ClipboardCheck, TrendingUp, ArrowUpRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { StatusBadge } from '../../components/ui/Badge'
import { formatDateTime } from '../../lib/utils'

async function fetchStats() {
  const [tenants, events, incidents] = await Promise.all([
    supabase.from('tenants').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'live'),
    supabase.from('incidents').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
  ])
  return {
    totalClients: tenants.count ?? 0,
    activeEvents: events.count ?? 0,
    liveIncidents: incidents.count ?? 0,
    pendingActions: 0,
  }
}

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: fetchStats })
  const { data: recentAudit = [], isLoading: auditLoading } = useQuery({
    queryKey: ['audit-recent'],
    queryFn: async () => {
      const { data } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(8)
      return data ?? []
    }
  })
  const { data: recentTenants = [] } = useQuery({
    queryKey: ['tenants-recent'],
    queryFn: async () => {
      const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false }).limit(5)
      return data ?? []
    }
  })

  const statCards = [
    {
      label: 'Total clients',
      value: stats?.totalClients ?? 0,
      icon: Building2,
      iconBg: 'bg-navy-50',
      iconColor: 'text-navy',
      change: null,
    },
    {
      label: 'Live events today',
      value: stats?.activeEvents ?? 0,
      icon: Calendar,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal',
      change: null,
    },
    {
      label: 'Open incidents',
      value: stats?.liveIncidents ?? 0,
      icon: AlertTriangle,
      iconBg: 'bg-danger-50',
      iconColor: 'text-danger',
      change: null,
    },
    {
      label: 'Pending actions',
      value: stats?.pendingActions ?? 0,
      icon: ClipboardCheck,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      change: null,
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview across all active clients and events</p>
      </div>

      {/* Stat cards */}
      {statsLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {statCards.map(card => (
            <div key={card.label} className="stat-card">
              <div className={`stat-icon ${card.iconBg}`}>
                <card.icon size={20} className={card.iconColor} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                <p className="text-3xl font-bold text-navy tabular-nums mt-0.5">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent clients */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-navy">Recent clients</h2>
            <a href="/admin/clients" className="text-xs text-teal font-medium hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          {recentTenants.length > 0 ? (
            <div className="space-y-3">
              {recentTenants.map((t: Record<string, unknown>) => (
                <div key={t.id as string} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-navy">{t.name as string}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{(t.type as string)?.replace(/_/g, ' ') ?? '—'}</p>
                  </div>
                  <StatusBadge status={t.status as string} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Building2 size={32} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No clients yet</p>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-navy">Recent activity</h2>
            <a href="/admin/audit" className="text-xs text-teal font-medium hover:underline flex items-center gap-1">
              Audit log <ArrowUpRight size={12} />
            </a>
          </div>
          {auditLoading ? <LoadingSpinner className="h-24" /> : (
            recentAudit.length > 0 ? (
              <div className="space-y-3">
                {recentAudit.map((log: Record<string, unknown>) => (
                  <div key={log.id as string} className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-full bg-navy-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingUp size={12} className="text-navy" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-navy">{log.action as string}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(log.created_at as string)}</p>
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
