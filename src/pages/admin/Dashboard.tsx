import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Calendar, AlertTriangle, ClipboardCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { StatusBadge } from '../../components/ui/Badge'
import { formatDateTime } from '../../lib/utils'

interface Stats {
  totalClients: number
  activeEvents: number
  liveIncidents: number
  pendingActions: number
}

async function fetchStats(): Promise<Stats> {
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
  const { data: recentAudit, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-recent'],
    queryFn: async () => {
      const { data } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(10)
      return data ?? []
    }
  })

  const statCards = [
    { label: 'Total clients', value: stats?.totalClients ?? 0, icon: Building2, color: 'text-navy' },
    { label: 'Active events', value: stats?.activeEvents ?? 0, icon: Calendar, color: 'text-teal' },
    { label: 'Live incidents', value: stats?.liveIncidents ?? 0, icon: AlertTriangle, color: 'text-danger' },
    { label: 'Pending actions', value: stats?.pendingActions ?? 0, icon: ClipboardCheck, color: 'text-amber' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-navy">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of all active clients and events</p>
      </div>

      {statsLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(card => (
            <div key={card.label} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-semibold text-navy mt-1">{card.value}</p>
                </div>
                <card.icon size={24} className={card.color} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="text-base font-semibold text-navy mb-4">Recent activity</h2>
        {auditLoading ? <LoadingSpinner className="h-24" /> : (
          recentAudit && recentAudit.length > 0 ? (
            <div className="space-y-3">
              {recentAudit.map((log: Record<string, unknown>) => (
                <div key={log.id as string} className="flex items-start gap-3 text-sm">
                  <span className="text-gray-400 text-xs whitespace-nowrap mt-0.5">{formatDateTime(log.created_at as string)}</span>
                  <span className="text-navy">{log.action as string}</span>
                  {typeof log.entity_type === 'string' && <StatusBadge status={log.entity_type} />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No recent activity.</p>
          )
        )}
      </div>
    </div>
  )
}
