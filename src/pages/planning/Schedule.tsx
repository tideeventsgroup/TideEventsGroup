import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronLeft, ChevronRight, Clock, User, Trash2, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { TideEvent } from '../../types'

interface Shift {
  id: string
  event_id: string
  staff_name: string
  role: string
  date: string
  start_time: string
  end_time: string
  zone?: string
  notes?: string
}

const SHIFT_ROLES = [
  { value: 'security', label: 'Security', color: '#FF9500' },
  { value: 'steward',  label: 'Steward',  color: '#5B8CFF' },
  { value: 'medical',  label: 'Medical',  color: '#FF3B30' },
  { value: 'welfare',  label: 'Welfare',  color: '#4ECDC4' },
  { value: 'comms',    label: 'Comms',    color: '#A78BFA' },
  { value: 'management', label: 'Management', color: '#E8521A' },
  { value: 'other',    label: 'Other',    color: '#636366' },
]

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isoDate(d: Date) {
  return d.toISOString().split('T')[0]
}

export function PlanningSchedule() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const canEdit = user && ['silver_command','event_manager','client_admin','super_admin','tide_consultant'].includes(user.role)

  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1)
    d.setHours(0,0,0,0)
    return d
  })
  const [selectedEvent, setSelectedEvent] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [form, setForm] = useState({ staff_name: '', role: 'security', start_time: '08:00', end_time: '16:00', zone: '', notes: '' })

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => api.get<TideEvent[]>('/events') })
  const activeEvent = selectedEvent || events.find(e => e.status !== 'closed')?.id || ''

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ['shifts', activeEvent, isoDate(weekStart)],
    queryFn: () => api.get<Shift[]>(`/shifts?event_id=${activeEvent}&from=${isoDate(weekStart)}&to=${isoDate(addDays(weekStart, 6))}`),
    enabled: !!activeEvent,
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/shifts', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); setShowAdd(false); setForm({ staff_name: '', role: 'security', start_time: '08:00', end_time: '16:00', zone: '', notes: '' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/shifts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  })

  const shiftsForDay = (date: Date) => shifts.filter(s => s.date === isoDate(date))

  const totalStaff = new Set(shifts.map(s => s.staff_name)).size
  const byRole: Record<string, number> = {}
  for (const s of shifts) { byRole[s.role] = (byRole[s.role] ?? 0) + 1 }

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900" style={{ letterSpacing: '-0.03em' }}>Staff Schedule</h1>
          <p className="text-gray-500 text-sm mt-1">{shifts.length} shifts · {totalStaff} staff members this week</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none bg-white">
            <option value="">Select Event</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {canEdit && (
            <button onClick={() => { setShowAdd(true); setSelectedDate(isoDate(new Date())) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{ background: '#E8521A' }}>
              <Plus size={15} /> Add Shift
            </button>
          )}
        </div>
      </div>

      {/* Role summary tiles */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
        {SHIFT_ROLES.map(({ value, label, color }) => (
          <div key={value} className="flex-shrink-0 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 text-center min-w-[80px]">
            <p className="font-black text-xl" style={{ color: byRole[value] ? color : '#E5E7EB' }}>{byRole[value] ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekStart(d => addDays(d, -7))}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
          <ChevronLeft size={16} /> Prev week
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {weekDays[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {weekDays[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <button onClick={() => setWeekStart(d => addDays(d, 7))}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
          Next week <ChevronRight size={16} />
        </button>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map(day => {
          const dayShifts = shiftsForDay(day)
          const isToday = isoDate(day) === isoDate(new Date())
          return (
            <div key={isoDate(day)} className="bg-white rounded-2xl border overflow-hidden"
              style={{ borderColor: isToday ? '#E8521A' : '#E5E7EB', boxShadow: isToday ? '0 0 0 1px #E8521A' : undefined }}>
              <div className="px-3 py-2.5 border-b" style={{ borderColor: isToday ? 'rgba(232,82,26,0.2)' : '#F3F4F6', background: isToday ? 'rgba(232,82,26,0.04)' : undefined }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: isToday ? '#E8521A' : '#9CA3AF' }}>
                  {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                </p>
                <p className="text-lg font-extrabold" style={{ color: isToday ? '#E8521A' : '#111827', letterSpacing: '-0.02em' }}>
                  {day.getDate()}
                </p>
              </div>
              <div className="p-2 space-y-1.5 min-h-[120px]">
                {dayShifts.map(shift => {
                  const roleInfo = SHIFT_ROLES.find(r => r.value === shift.role)
                  return (
                    <div key={shift.id} className="group relative rounded-lg px-2 py-1.5"
                      style={{ background: `${roleInfo?.color ?? '#636366'}10`, borderLeft: `3px solid ${roleInfo?.color ?? '#636366'}` }}>
                      <p className="text-xs font-semibold text-gray-800 truncate">{shift.staff_name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={9} className="text-gray-400" />
                        <span className="text-xs text-gray-400">{shift.start_time}–{shift.end_time}</span>
                      </div>
                      {canEdit && (
                        <button onClick={() => window.confirm('Remove shift?') && deleteMutation.mutate(shift.id)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400">
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  )
                })}
                {canEdit && (
                  <button onClick={() => { setShowAdd(true); setSelectedDate(isoDate(day)) }}
                    className="w-full flex items-center justify-center py-1.5 rounded-lg border border-dashed border-gray-200 text-gray-300 hover:text-gray-400 hover:border-gray-300 transition-colors">
                    <Plus size={12} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* All shifts list */}
      {shifts.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-gray-400" />
            <h2 className="font-bold text-gray-900 text-sm">All Shifts This Week</h2>
          </div>
          <div className="space-y-2">
            {shifts.map(shift => {
              const roleInfo = SHIFT_ROLES.find(r => r.value === shift.role)
              return (
                <div key={shift.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-lg"
                      style={{ background: `${roleInfo?.color ?? '#636366'}12`, width: 32, height: 32 }}>
                      <User size={14} style={{ color: roleInfo?.color ?? '#636366' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{shift.staff_name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(shift.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {shift.start_time}–{shift.end_time}
                        {shift.zone && ` · ${shift.zone}`}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: `${roleInfo?.color ?? '#636366'}12`, color: roleInfo?.color ?? '#636366' }}>
                    {roleInfo?.label ?? shift.role}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add shift modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Add Shift</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Date</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Staff Name *</label>
                <input value={form.staff_name} onChange={e => setForm(p => ({ ...p, staff_name: e.target.value }))} placeholder="Full name"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400">
                  {SHIFT_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">End Time</label>
                  <input type="time" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Zone / Location</label>
                <input value={form.zone} onChange={e => setForm(p => ({ ...p, zone: e.target.value }))} placeholder="e.g. North Gate"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => createMutation.mutate({ ...form, event_id: activeEvent, date: selectedDate })}
                disabled={!form.staff_name || !selectedDate || createMutation.isPending}
                className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-40"
                style={{ background: '#E8521A' }}>
                {createMutation.isPending ? 'Adding…' : 'Add Shift'}
              </button>
              <button onClick={() => setShowAdd(false)} className="px-5 py-3 rounded-xl font-semibold text-gray-500"
                style={{ background: '#F2F3F7' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
