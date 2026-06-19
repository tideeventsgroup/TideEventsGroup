import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, Users, Radio, ArrowUpRight, Plus, Clock,
  Activity, Shield, Heart, Zap, User, MapPin, RefreshCw
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import type { TideEvent, Incident, Resource, EventStats } from '../../types'
import { PRIORITY_COLORS, STATUS_COLORS } from '../../types'

function PriorityBadge({ priority }: { priority: string }) {
  const c = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] ?? { bg: '#636366', text: '#fff', border: '#636366' }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold"
      style={{ background: c.bg, color: c.text, minWidth: 28, justifyContent: 'center' }}>
      {priority}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const c = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? { bg: 'rgba(99,99,102,0.15)', text: '#636366' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  )
}

function IncidentAge({ createdAt }: { createdAt: string }) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  if (mins < 60) return <span className="text-white/40 text-xs">{mins}m</span>
  return <span className="text-white/40 text-xs">{Math.floor(mins / 60)}h {mins % 60}m</span>
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, React.ReactNode> = {
    security: <Shield size={12} />,
    medical:  <Heart size={12} />,
    safety:   <Zap size={12} />,
    welfare:  <User size={12} />,
    infrastructure: <Radio size={12} />,
  }
  const colors: Record<string, string> = {
    security: '#FF9500', medical: '#FF3B30', safety: '#FF3B30',
    welfare: '#5AC8FA', infrastructure: '#FFCC00',
  }
  return (
    <span style={{ color: colors[category] ?? '#636366' }}>
      {icons[category] ?? <AlertTriangle size={12} />}
    </span>
  )
}

function OperationalMap({ event, incidents }: { event: TideEvent | null; incidents: Incident[] }) {
  const criticalCount = incidents.filter(i => i.priority === 'P1').length
  const zones = ['Main Stage', 'North Gate', 'South Gate', 'Medical Hub', 'Security Post', 'Welfare', 'Car Park', 'VIP Area']

  return (
    <div className="relative flex-1 rounded-xl overflow-hidden" style={{ background: '#0D0E12', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Grid overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.02) 0,rgba(255,255,255,0.02) 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,rgba(255,255,255,0.02) 0,rgba(255,255,255,0.02) 1px,transparent 1px,transparent 40px)',
      }} />

      {/* Header */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <MapPin size={13} style={{ color: '#E8521A' }} />
          <span className="text-white text-xs font-semibold">{event?.venue_name ?? 'Operational Area'}</span>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg critical-pulse"
            style={{ background: 'rgba(255,59,48,0.2)', border: '1px solid rgba(255,59,48,0.4)', backdropFilter: 'blur(8px)' }}>
            <AlertTriangle size={12} style={{ color: '#FF3B30' }} />
            <span className="text-xs font-bold" style={{ color: '#FF3B30' }}>{criticalCount} CRITICAL</span>
          </div>
        )}
      </div>

      {/* Zone map representation */}
      <div className="absolute inset-0 flex items-center justify-center p-10">
        <div className="w-full h-full relative">
          {/* Venue outline */}
          <div className="absolute inset-8 rounded-3xl" style={{ border: '2px solid rgba(255,255,255,0.08)' }} />

          {/* Stage area */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-16 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(232,82,26,0.08)', border: '1px solid rgba(232,82,26,0.2)' }}>
            <span className="text-xs font-bold" style={{ color: '#E8521A' }}>MAIN STAGE</span>
          </div>

          {/* Incident markers */}
          {incidents.filter(i => !['resolved','closed'].includes(i.status)).slice(0, 12).map((incident, idx) => {
            const c = PRIORITY_COLORS[incident.priority]
            const angle = (idx / Math.max(incidents.length, 1)) * Math.PI * 2
            const r = 30 + (idx % 3) * 12
            const x = 50 + Math.cos(angle) * r
            const y = 50 + Math.sin(angle) * r * 0.6
            return (
              <Link
                key={incident.id}
                to={`/live/incidents/${incident.id}`}
                title={`${incident.cad_number}: ${incident.incident_type ?? incident.category}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform"
                style={{ left: `${Math.max(5, Math.min(95, x))}%`, top: `${Math.max(5, Math.min(95, y))}%` }}
              >
                <div className="flex items-center justify-center rounded-full text-white font-bold"
                  style={{ background: c.bg, width: incident.priority === 'P1' ? 22 : 18, height: incident.priority === 'P1' ? 22 : 18, fontSize: 9, border: `2px solid ${c.bg}`, boxShadow: incident.priority === 'P1' ? `0 0 8px ${c.bg}` : undefined }}>
                  {incident.priority}
                </div>
              </Link>
            )
          })}

          {/* Zone labels */}
          <div className="absolute top-10 left-10 text-white/20 text-xs">N GATE</div>
          <div className="absolute bottom-10 left-10 text-white/20 text-xs">S GATE</div>
          <div className="absolute top-10 right-10 text-white/20 text-xs">MED HUB</div>
          <div className="absolute bottom-10 right-10 text-white/20 text-xs">WELFARE</div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 px-3 py-1.5 rounded-lg"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
        {(['P1','P2','P3'] as const).map(p => {
          const c = PRIORITY_COLORS[p]
          return (
            <div key={p} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: c.bg }} />
              <span className="text-white/50 text-xs">{p}</span>
            </div>
          )
        })}
        <span className="text-white/20 text-xs">· Click to open</span>
      </div>
    </div>
  )
}

function ResourceSummary({ resources }: { resources: Resource[] }) {
  const byType: Record<string, { total: number; available: number }> = {}
  for (const r of resources) {
    if (!byType[r.type]) byType[r.type] = { total: 0, available: 0 }
    byType[r.type].total++
    if (r.status === 'available') byType[r.type].available++
  }

  const typeLabels: Record<string, string> = {
    security_team: 'Security', medical_team: 'Medical', steward_team: 'Stewarding',
    personnel: 'Personnel', vehicle: 'Vehicles', event_staff: 'Staff',
  }

  return (
    <div className="space-y-2">
      {Object.entries(byType).map(([type, { total, available }]) => (
        <div key={type} className="flex items-center justify-between">
          <span className="text-white/50 text-xs">{typeLabels[type] ?? type}</span>
          <div className="flex items-center gap-2">
            <div className="h-1 rounded-full overflow-hidden" style={{ width: 60, background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{
                width: `${total ? (available / total) * 100 : 0}%`,
                background: available === 0 ? '#FF3B30' : available < total / 2 ? '#FF9500' : '#34C759',
              }} />
            </div>
            <span className="text-white text-xs font-bold">{available}<span className="text-white/30">/{total}</span></span>
          </div>
        </div>
      ))}
      {Object.keys(byType).length === 0 && (
        <p className="text-white/30 text-xs">No resources deployed</p>
      )}
    </div>
  )
}

export function LiveDashboard() {
  const { user } = useAuth()
  const canCreate = user && ['silver_command','incident_manager','cad_operator','event_manager','super_admin'].includes(user.role)

  const { data: events = [] } = useQuery({
    queryKey: ['live-events'],
    queryFn: () => api.get<TideEvent[]>('/events?status=live'),
    refetchInterval: 30000,
  })
  const liveEvent = events[0] ?? null

  const { data: incidents = [], isLoading: incLoading, refetch: refetchInc } = useQuery({
    queryKey: ['live-incidents', liveEvent?.id],
    queryFn: () => liveEvent
      ? api.get<Incident[]>(`/incidents?event_id=${liveEvent.id}&limit=50`)
      : Promise.resolve([]),
    enabled: !!liveEvent,
    refetchInterval: 15000,
  })

  const { data: resources = [] } = useQuery({
    queryKey: ['live-resources', liveEvent?.id],
    queryFn: () => liveEvent ? api.get<Resource[]>(`/resources?event_id=${liveEvent.id}`) : Promise.resolve([]),
    enabled: !!liveEvent,
    refetchInterval: 20000,
  })

  const { data: stats } = useQuery({
    queryKey: ['live-stats', liveEvent?.id],
    queryFn: () => liveEvent ? api.get<EventStats>(`/stats?event_id=${liveEvent.id}`) : null,
    enabled: !!liveEvent,
    refetchInterval: 30000,
  })

  const openIncidents = incidents.filter(i => !['resolved','closed'].includes(i.status))
  const criticalIncidents = incidents.filter(i => i.priority === 'P1' && !['resolved','closed'].includes(i.status))
  const medicalIncidents = incidents.filter(i => i.category === 'medical' && !['resolved','closed'].includes(i.status))
  const securityIncidents = incidents.filter(i => i.category === 'security' && !['resolved','closed'].includes(i.status))

  const statusCategories = [
    { label: 'Open', count: openIncidents.length, color: '#FF9500' },
    { label: 'Critical P1', count: criticalIncidents.length, color: '#FF3B30', pulse: criticalIncidents.length > 0 },
    { label: 'Medical', count: medicalIncidents.length, color: '#FF3B30' },
    { label: 'Security', count: securityIncidents.length, color: '#FF9500' },
    { label: 'Welfare', count: incidents.filter(i => i.category === 'welfare' && !['resolved','closed'].includes(i.status)).length, color: '#5AC8FA' },
    { label: 'Resolved', count: incidents.filter(i => ['resolved','closed'].includes(i.status)).length, color: '#34C759' },
  ]

  if (!liveEvent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Radio size={48} className="text-white/10 mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">No Live Event</h2>
        <p className="text-white/40 text-sm mb-6">There is no event currently in live status.</p>
        <Link to="/planning/events" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#E8521A' }}>
          Go to Planning
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-full" style={{ background: '#0A0B0F' }}>

      {/* LEFT PANEL — Incident Queue */}
      <div className="flex flex-col flex-shrink-0" style={{ width: 320, borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Queue header */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-white font-bold text-sm">Incident Queue</h2>
            <p className="text-white/30 text-xs">{openIncidents.length} open · sorted by priority</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetchInc()} className="text-white/30 hover:text-white/70 transition-colors">
              <RefreshCw size={13} />
            </button>
            {canCreate && (
              <Link to="/live/incidents/new"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white"
                style={{ background: '#E8521A' }}>
                <Plus size={11} /> New
              </Link>
            )}
          </div>
        </div>

        {/* Queue list */}
        <div className="flex-1 overflow-auto">
          {incLoading ? (
            <div className="flex justify-center pt-8"><LoadingSpinner /></div>
          ) : openIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-white/20">
              <Activity size={24} className="mb-2" />
              <p className="text-xs">No open incidents</p>
            </div>
          ) : (
            openIncidents.map(incident => {
              const pc = PRIORITY_COLORS[incident.priority]
              return (
                <Link
                  key={incident.id}
                  to={`/live/incidents/${incident.id}`}
                  className="block px-3 py-3 hover:bg-white/3 transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: `3px solid ${pc.bg}` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <PriorityBadge priority={incident.priority} />
                      <span className="text-white/50 text-xs font-mono truncate">{incident.cad_number}</span>
                    </div>
                    <IncidentAge createdAt={incident.created_at} />
                  </div>
                  <p className="text-white text-xs font-semibold mb-1 capitalize">
                    {incident.incident_type?.replace(/_/g, ' ') ?? incident.category}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-white/40 text-xs">
                      <MapPin size={10} />
                      <span className="truncate max-w-28">{incident.location_zone ?? '—'}</span>
                    </div>
                    <StatusDot status={incident.status} />
                  </div>
                  {incident.assigned_to_name && (
                    <div className="flex items-center gap-1 mt-1 text-white/30 text-xs">
                      <Users size={10} />
                      <span className="truncate">{incident.assigned_to_name}</span>
                    </div>
                  )}
                </Link>
              )
            })
          )}
        </div>

        {/* Resolved section */}
        {incidents.filter(i => ['resolved','closed'].includes(i.status)).length > 0 && (
          <div className="px-3 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link to="/live/incidents" className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors">
              <Clock size={11} />
              {incidents.filter(i => ['resolved','closed'].includes(i.status)).length} resolved this session
              <ArrowUpRight size={11} />
            </Link>
          </div>
        )}
      </div>

      {/* CENTRE PANEL — Map */}
      <div className="flex-1 flex flex-col min-w-0 p-3">
        <OperationalMap event={liveEvent} incidents={incidents} />
      </div>

      {/* RIGHT PANEL — Status Board */}
      <div className="flex flex-col flex-shrink-0 overflow-auto"
        style={{ width: 256, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Event name + live indicator */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="h-2 w-2 rounded-full live-dot flex-shrink-0" style={{ background: '#34C759' }} />
            <span className="text-white font-bold text-sm truncate">{liveEvent.name}</span>
          </div>
          {liveEvent.expected_attendance && (
            <p className="text-white/30 text-xs pl-4">Capacity: {liveEvent.expected_attendance.toLocaleString()}</p>
          )}
        </div>

        {/* 2×3 status grid */}
        <div className="p-3">
          <p className="text-white/25 text-xs font-bold uppercase tracking-widest mb-2.5 px-1">Live Picture</p>
          <div className="grid grid-cols-2 gap-2">
            {statusCategories.map(({ label, count, color, pulse }) => (
              <div key={label}
                className={`flex flex-col px-3 py-3 rounded-xl ${pulse && count > 0 ? 'critical-pulse' : ''}`}
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${pulse && count > 0 ? color + '30' : 'transparent'}` }}>
                <span className="font-black text-2xl leading-none tabular-nums"
                  style={{ color: count === 0 ? 'rgba(255,255,255,0.12)' : color }}>
                  {count}
                </span>
                <span className="text-white/40 text-xs mt-1.5 leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px mx-3" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Resource availability */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-white/25 text-xs font-bold uppercase tracking-widest px-1">Resources</p>
            <Link to="/live/resources" className="text-white/25 hover:text-white/60 transition-colors">
              <ArrowUpRight size={12} />
            </Link>
          </div>
          <ResourceSummary resources={resources} />
        </div>

        <div className="h-px mx-3" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Performance metrics */}
        {stats && (
          <div className="p-3">
            <p className="text-white/25 text-xs font-bold uppercase tracking-widest mb-2.5 px-1">Performance</p>
            <div className="space-y-2">
              {[
                { label: 'Avg resolution', value: `${stats.avgResolutionMin}m` },
                { label: 'Total incidents', value: stats.totalIncidents },
                { label: 'Resolution rate', value: `${stats.totalIncidents > 0 ? Math.round((stats.resolvedIncidents / stats.totalIncidents) * 100) : 0}%` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-1 py-1">
                  <span className="text-white/40 text-xs">{label}</span>
                  <span className="text-white font-bold text-sm tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View all link */}
        <div className="mt-auto p-3">
          <Link to="/live/incidents"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(232,82,26,0.1)', border: '1px solid rgba(232,82,26,0.2)', color: '#E8521A' }}>
            Full Incident Log <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

    </div>
  )
}
