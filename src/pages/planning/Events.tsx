import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Calendar, MapPin, Users, ChevronRight, Search, Radio } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { TideEvent, EventType, RiskLevel } from '../../types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  planning:         { bg: 'rgba(91,140,255,0.1)', text: '#5B8CFF' },
  documentation:    { bg: 'rgba(255,149,0,0.1)', text: '#FF9500' },
  pre_event_review: { bg: 'rgba(255,204,0,0.1)', text: '#FFCC00' },
  live:             { bg: 'rgba(52,199,89,0.12)', text: '#34C759' },
  post_event:       { bg: 'rgba(99,99,102,0.1)', text: '#636366' },
  closed:           { bg: 'rgba(99,99,102,0.08)', text: '#636366' },
}

const EVENT_TYPES: EventType[] = ['outdoor_festival','indoor_venue','stadium','concert','sporting_event','motorsport','council','community_event','harbour_event','street_event']
const RISK_LEVELS: RiskLevel[] = ['low','medium','high','critical']

export function PlanningEvents() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'outdoor_festival' as EventType, venue_name: '', venue_address: '',
    start_date: '', end_date: '', expected_attendance: '', capacity: '',
    risk_level: 'medium' as RiskLevel,
    operational_hours_start: '08:00', operational_hours_end: '23:00',
  })

  const canCreate = user && ['silver_command','event_manager','client_admin','super_admin','tide_consultant'].includes(user.role)

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get<TideEvent[]>('/events'),
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<Record<string, unknown>>('/events', body),
    onSuccess: (event: Record<string, unknown>) => {
      qc.invalidateQueries({ queryKey: ['events'] })
      setShowNew(false)
      navigate(`/planning/events/${event.id}`)
    },
  })

  const goLiveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/events/${id}`, { status: 'live' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })

  const filtered = events.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.venue_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    createMutation.mutate({
      ...form,
      expected_attendance: form.expected_attendance ? parseInt(form.expected_attendance) : null,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      tenant_id: user.tenant_id,
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900" style={{ letterSpacing: '-0.03em' }}>Events</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} total · {events.filter(e => e.status !== 'closed').length} active</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm"
            style={{ background: '#E8521A' }}>
            <Plus size={15} /> New Event
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search events…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {/* List */}
      {isLoading ? <LoadingSpinner /> : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-300">
              <Calendar size={40} className="mb-3" />
              <p className="text-gray-400">No events found</p>
              {canCreate && (
                <button onClick={() => setShowNew(true)} className="mt-3 text-sm font-semibold hover:underline"
                  style={{ color: '#E8521A' }}>Create first event</button>
              )}
            </div>
          ) : filtered.map(event => {
            const sc = STATUS_STYLES[event.status] ?? STATUS_STYLES.planning
            return (
              <Link key={event.id} to={`/planning/events/${event.id}`}
                className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center justify-center rounded-xl font-black text-sm"
                    style={{ background: 'rgba(232,82,26,0.08)', color: '#E8521A', width: 44, height: 44 }}>
                    {event.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 truncate">{event.name}</p>
                      {event.status === 'live' && (
                        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#34C759' }}>
                          <span className="h-1.5 w-1.5 rounded-full live-dot" style={{ background: '#34C759' }} /> LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 text-xs mt-0.5">
                      {event.venue_name && <span className="flex items-center gap-1"><MapPin size={10} />{event.venue_name}</span>}
                      {event.expected_attendance && <span className="flex items-center gap-1"><Users size={10} />{event.expected_attendance.toLocaleString()}</span>}
                      {event.start_date && <span className="flex items-center gap-1"><Calendar size={10} />{new Date(event.start_date).toLocaleDateString('en-GB')}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                    style={{ background: sc.bg, color: sc.text }}>
                    {event.status.replace(/_/g,' ')}
                  </span>
                  {canCreate && event.status === 'pre_event_review' && (
                    <button
                      onClick={e => { e.preventDefault(); goLiveMutation.mutate(event.id) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                      style={{ background: '#34C759' }}>
                      <Radio size={11} /> Go Live
                    </button>
                  )}
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* New Event modal */}
      {showNew && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-auto max-h-screen-90">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">New Event</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Event Name *</label>
                <input required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  placeholder="e.g. Edinburgh Summer Festival 2025"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Event Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value as EventType}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400 capitalize">
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Risk Level</label>
                  <select value={form.risk_level} onChange={e => setForm(p => ({...p, risk_level: e.target.value as RiskLevel}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400">
                    {RISK_LEVELS.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Venue Name</label>
                <input value={form.venue_name} onChange={e => setForm(p => ({...p, venue_name: e.target.value}))}
                  placeholder="e.g. Princes Street Gardens"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Venue Address</label>
                <input value={form.venue_address} onChange={e => setForm(p => ({...p, venue_address: e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Start Date</label>
                  <input type="datetime-local" value={form.start_date} onChange={e => setForm(p => ({...p, start_date: e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">End Date</label>
                  <input type="datetime-local" value={form.end_date} onChange={e => setForm(p => ({...p, end_date: e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Expected Attendance</label>
                  <input type="number" value={form.expected_attendance} onChange={e => setForm(p => ({...p, expected_attendance: e.target.value}))}
                    placeholder="e.g. 25000"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Capacity</label>
                  <input type="number" value={form.capacity} onChange={e => setForm(p => ({...p, capacity: e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Ops Start</label>
                  <input type="time" value={form.operational_hours_start} onChange={e => setForm(p => ({...p, operational_hours_start: e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Ops End</label>
                  <input type="time" value={form.operational_hours_end} onChange={e => setForm(p => ({...p, operational_hours_end: e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-40"
                  style={{ background: '#E8521A' }}>
                  {createMutation.isPending ? 'Creating…' : 'Create Event'}
                </button>
                <button type="button" onClick={() => setShowNew(false)}
                  className="px-6 py-3 rounded-xl font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                  style={{ background: '#F2F3F7' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
