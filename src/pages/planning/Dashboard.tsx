import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, AlertTriangle, Users, FolderOpen, ArrowUpRight, Plus, Clock, CheckCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { TideEvent, Risk } from '../../types'

function EventStatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    planning: { bg: 'rgba(91,140,255,0.12)', text: '#5B8CFF' },
    documentation: { bg: 'rgba(255,149,0,0.12)', text: '#FF9500' },
    pre_event_review: { bg: 'rgba(255,204,0,0.12)', text: '#FFCC00' },
    live: { bg: 'rgba(52,199,89,0.12)', text: '#34C759' },
    post_event: { bg: 'rgba(99,99,102,0.12)', text: '#636366' },
    closed: { bg: 'rgba(99,99,102,0.08)', text: '#636366' },
  }
  const c = colors[status] ?? { bg: 'rgba(99,99,102,0.1)', text: '#636366' }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: c.bg, color: c.text }}>
      {status.replace(/_/g,' ')}
    </span>
  )
}

function riskColor(score: number | null) {
  if (!score) return '#636366'
  if (score >= 15) return '#FF3B30'
  if (score >= 8) return '#FF9500'
  return '#34C759'
}

export function PlanningDashboard() {
  const { user } = useAuth()

  const { data: events = [] } = useQuery({
    queryKey: ['planning-events'],
    queryFn: () => api.get<TideEvent[]>('/events'),
    refetchInterval: 60000,
  })

  const activeEvents = events.filter(e => !['closed'].includes(e.status))
  const liveEvent = events.find(e => e.status === 'live')

  const kpis = [
    { label: 'Active Events', value: activeEvents.length, icon: Calendar, color: '#5B8CFF' },
    { label: 'Live Event', value: liveEvent ? 1 : 0, icon: CheckCircle, color: '#34C759' },
    { label: 'Planning', value: events.filter(e => e.status === 'planning').length, icon: Clock, color: '#FF9500' },
    { label: 'Total Events', value: events.length, icon: Calendar, color: '#636366' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F0F14', letterSpacing: '-0.03em' }}>
            Planning Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link to="/planning/events/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm"
          style={{ background: '#E8521A' }}>
          <Plus size={15} /> New Event
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-5 bg-white shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center rounded-xl" style={{ background: `${color}15`, width: 36, height: 36 }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <p className="text-3xl font-extrabold" style={{ color }}>{value}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6">

        {/* Events list */}
        <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Events</h2>
            <Link to="/planning/events" className="flex items-center gap-1 text-xs font-semibold hover:underline"
              style={{ color: '#E8521A' }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {activeEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300">
              <Calendar size={32} className="mb-2" />
              <p className="text-sm text-gray-400">No active events</p>
              <Link to="/planning/events/new" className="mt-3 text-xs font-semibold hover:underline"
                style={{ color: '#E8521A' }}>Create your first event</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {activeEvents.slice(0, 6).map(event => (
                <Link key={event.id} to={`/planning/events/${event.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-lg font-bold text-xs"
                      style={{ background: 'rgba(232,82,26,0.08)', color: '#E8521A', width: 32, height: 32 }}>
                      {event.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{event.name}</p>
                      <p className="text-xs text-gray-400">{event.venue_name ?? 'No venue'} · {event.start_date ? new Date(event.start_date).toLocaleDateString('en-GB') : 'TBC'}</p>
                    </div>
                  </div>
                  <EventStatusBadge status={event.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4">Quick Links</h2>
            <div className="space-y-2">
              {[
                { to: '/planning/risks', label: 'Risk Register', icon: AlertTriangle, color: '#FF9500' },
                { to: '/planning/resources', label: 'Resource Planning', icon: Users, color: '#5B8CFF' },
                { to: '/planning/documents', label: 'Document Library', icon: FolderOpen, color: '#4ECDC4' },
                { to: '/planning/schedule', label: 'Staff Schedule', icon: Clock, color: '#34C759' },
              ].map(({ to, label, icon: Icon, color }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-center rounded-lg"
                    style={{ background: `${color}12`, width: 28, height: 28 }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <ArrowUpRight size={13} className="ml-auto text-gray-300" />
                </Link>
              ))}
            </div>
          </div>

          {liveEvent && (
            <div className="rounded-2xl p-4"
              style={{ background: 'linear-gradient(135deg,#E8521A,#f06432)', boxShadow: '0 4px 20px rgba(232,82,26,0.3)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Live Now</span>
              </div>
              <p className="text-white font-bold">{liveEvent.name}</p>
              <p className="text-white/70 text-xs mt-1">{liveEvent.venue_name}</p>
              <Link to="/live" className="mt-3 flex items-center gap-1.5 text-white text-xs font-bold">
                Go to Live Dashboard <ArrowUpRight size={12} />
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
