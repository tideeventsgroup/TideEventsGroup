import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, MapPin, Shield, Heart, Users, Car, Zap, Trash2, Edit2, Check, X } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { TideEvent } from '../../types'

interface Zone {
  id: string
  event_id: string
  name: string
  zone_type: string
  capacity?: number
  description?: string
  grid_ref?: string
  status: 'active' | 'restricted' | 'closed'
}

const ZONE_TYPES = [
  { value: 'stage',        label: 'Main Stage',     Icon: Zap,     color: '#E8521A' },
  { value: 'entrance',     label: 'Entrance / Gate',Icon: Users,   color: '#5B8CFF' },
  { value: 'medical',      label: 'Medical Post',   Icon: Heart,   color: '#FF3B30' },
  { value: 'security',     label: 'Security Post',  Icon: Shield,  color: '#FF9500' },
  { value: 'welfare',      label: 'Welfare',        Icon: Heart,   color: '#4ECDC4' },
  { value: 'parking',      label: 'Car Park',       Icon: Car,     color: '#636366' },
  { value: 'rvp',          label: 'RVP',            Icon: MapPin,  color: '#A78BFA' },
  { value: 'control',      label: 'Event Control',  Icon: Zap,     color: '#FFCC00' },
  { value: 'other',        label: 'Other',          Icon: MapPin,  color: '#636366' },
]

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active:     { bg: 'rgba(52,199,89,0.1)',  text: '#34C759', label: 'Active' },
  restricted: { bg: 'rgba(255,149,0,0.1)',  text: '#FF9500', label: 'Restricted' },
  closed:     { bg: 'rgba(255,59,48,0.1)',  text: '#FF3B30', label: 'Closed' },
}

export function PlanningSiteMap() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const canEdit = user && ['client_admin','super_admin','tide_consultant','event_manager','silver_command'].includes(user.role)

  const [selectedEvent, setSelectedEvent] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', zone_type: 'entrance', capacity: '', description: '', grid_ref: '', status: 'active' as Zone['status'] })

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => api.get<TideEvent[]>('/events') })
  const activeEvent = selectedEvent || events.find(e => e.status !== 'closed')?.id || ''

  const { data: zones = [], isLoading } = useQuery<Zone[]>({
    queryKey: ['zones', activeEvent],
    queryFn: () => api.get<Zone[]>(`/zones?event_id=${activeEvent}`),
    enabled: !!activeEvent,
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/zones', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['zones'] }); setShowAdd(false); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api.patch(`/zones/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['zones'] }); setEditId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/zones/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  })

  function resetForm() {
    setForm({ name: '', zone_type: 'entrance', capacity: '', description: '', grid_ref: '', status: 'active' })
  }

  const byType: Record<string, Zone[]> = {}
  for (const z of zones) {
    if (!byType[z.zone_type]) byType[z.zone_type] = []
    byType[z.zone_type].push(z)
  }

  const activeCount = zones.filter(z => z.status === 'active').length
  const totalCap    = zones.reduce((s, z) => s + (z.capacity ?? 0), 0)

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900" style={{ letterSpacing: '-0.03em' }}>Site Mapping</h1>
          <p className="text-gray-500 text-sm mt-1">
            {zones.length} zones · {activeCount} active · {totalCap > 0 ? `${totalCap.toLocaleString()} capacity` : 'no capacity set'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none bg-white">
            <option value="">Select Event</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {canEdit && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{ background: '#E8521A' }}>
              <Plus size={15} /> Add Zone
            </button>
          )}
        </div>
      </div>

      {/* Zone type summary grid */}
      <div className="grid grid-cols-4 gap-3 mb-6 lg:grid-cols-9">
        {ZONE_TYPES.map(({ value, label, Icon, color }) => {
          const count = (byType[value] ?? []).length
          return (
            <div key={value} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100 col-span-1">
              <div className="flex items-center justify-center mx-auto mb-1.5 rounded-lg"
                style={{ background: count ? `${color}12` : '#F9FAFB', width: 32, height: 32 }}>
                <Icon size={14} style={{ color: count ? color : '#D1D5DB' }} />
              </div>
              <p className="font-black text-xl" style={{ color: count ? color : '#E5E7EB' }}>{count}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</p>
            </div>
          )
        })}
      </div>

      {/* Schematic grid — visual zone layout */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Site Schematic</h2>
          <span className="text-xs text-gray-400">Drag-and-drop map — Azure Maps integration coming soon</span>
        </div>
        <div className="relative rounded-2xl overflow-hidden" style={{ background: '#F8F9FB', minHeight: 280, border: '1px solid #E5E7EB' }}>
          {/* Grid overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg,#E5E7EB 0,#E5E7EB 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#E5E7EB 0,#E5E7EB 1px,transparent 1px,transparent 40px)',
          }} />
          {/* Rendered zones */}
          {zones.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
              <MapPin size={40} className="mb-3" />
              <p className="text-sm text-gray-400">Add zones to see them here</p>
            </div>
          ) : (
            <div className="absolute inset-4 flex flex-wrap gap-3 content-start">
              {zones.map((zone, idx) => {
                const typeInfo = ZONE_TYPES.find(t => t.value === zone.zone_type)
                const Icon = typeInfo?.Icon ?? MapPin
                const color = typeInfo?.color ?? '#636366'
                return (
                  <div key={zone.id} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-sm"
                    style={{ background: `${color}12`, border: `1px solid ${color}30`, color }}>
                    <Icon size={12} />
                    {zone.name}
                    {zone.grid_ref && <span className="text-gray-400 font-normal">({zone.grid_ref})</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Zone list by type */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-300">Loading zones…</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byType).map(([type, list]) => {
            const typeInfo = ZONE_TYPES.find(t => t.value === type)
            const Icon = typeInfo?.Icon ?? MapPin
            return (
              <div key={type}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: typeInfo?.color ?? '#636366' }}>{typeInfo?.label ?? type}</p>
                <div className="space-y-2">
                  {list.map(zone => {
                    const color = typeInfo?.color ?? '#636366'
                    const st = STATUS_STYLES[zone.status]
                    return (
                      <div key={zone.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center rounded-xl" style={{ background: `${color}12`, width: 40, height: 40 }}>
                            <Icon size={16} style={{ color }} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{zone.name}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                              {zone.grid_ref && <span>Grid: {zone.grid_ref}</span>}
                              {zone.capacity && <span>{zone.capacity.toLocaleString()} cap.</span>}
                              {zone.description && <span className="truncate max-w-48">{zone.description}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: st.bg, color: st.text }}>{st.label}</span>
                          {canEdit && (
                            <button onClick={() => window.confirm('Delete zone?') && deleteMutation.mutate(zone.id)}
                              className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {zones.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-300">
              <MapPin size={40} className="mb-3" />
              <p className="text-gray-400">No zones added yet</p>
            </div>
          )}
        </div>
      )}

      {/* Add zone modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Add Zone</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Zone Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. North Gate 1"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Type</label>
                  <select value={form.zone_type} onChange={e => setForm(p => ({ ...p, zone_type: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400">
                    {ZONE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Zone['status'] }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400">
                    <option value="active">Active</option>
                    <option value="restricted">Restricted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Capacity</label>
                  <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Grid Ref</label>
                  <input value={form.grid_ref} onChange={e => setForm(p => ({ ...p, grid_ref: e.target.value }))} placeholder="e.g. A3"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Brief description…"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { const ev = events.find(e => e.id === activeEvent); ev && createMutation.mutate({ ...form, event_id: activeEvent, tenant_id: ev.tenant_id, capacity: form.capacity ? parseInt(form.capacity) : null }) }}
                disabled={!form.name || createMutation.isPending}
                className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-40"
                style={{ background: '#E8521A' }}>
                {createMutation.isPending ? 'Adding…' : 'Add Zone'}
              </button>
              <button onClick={() => { setShowAdd(false); resetForm() }} className="px-5 py-3 rounded-xl font-semibold text-gray-500"
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
