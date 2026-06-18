import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, Truck, Heart, Shield, Radio, Edit2, Trash2, X, Save } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import type { TideEvent, Resource, ResourceStatus, ResourceType } from '../../types'

const RESOURCE_TYPES: { value: ResourceType; label: string; icon: React.ElementType }[] = [
  { value: 'security_team', label: 'Security', icon: Shield },
  { value: 'medical_team', label: 'Medical', icon: Heart },
  { value: 'steward_team', label: 'Stewarding', icon: Users },
  { value: 'personnel', label: 'Personnel', icon: Users },
  { value: 'vehicle', label: 'Vehicle', icon: Truck },
  { value: 'event_staff', label: 'Event Staff', icon: Users },
  { value: 'contractor', label: 'Contractor', icon: Users },
  { value: 'equipment', label: 'Equipment', icon: Radio },
]

const STATUS_COLORS: Record<ResourceStatus, { bg: string; text: string }> = {
  available:   { bg: 'rgba(52,199,89,0.15)', text: '#34C759' },
  assigned:    { bg: 'rgba(255,149,0,0.15)', text: '#FF9500' },
  en_route:    { bg: 'rgba(255,204,0,0.15)', text: '#FFCC00' },
  on_scene:    { bg: 'rgba(90,200,250,0.15)', text: '#5AC8FA' },
  unavailable: { bg: 'rgba(255,59,48,0.15)', text: '#FF3B30' },
  off_duty:    { bg: 'rgba(99,99,102,0.15)', text: '#636366' },
}

const ZONES = ['Main Stage','North Gate','South Gate','Medical Hub','Security Post','Welfare','Car Park','VIP Area','Backstage','Roaming']

export function LiveResources() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const canManage = user && ['silver_command','operations_manager','event_manager','super_admin'].includes(user.role)

  const [showAdd, setShowAdd] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [newResource, setNewResource] = useState({ name: '', type: 'personnel' as ResourceType, call_sign: '', phone: '', location_zone: '' })

  const { data: events = [] } = useQuery({
    queryKey: ['live-events'],
    queryFn: () => api.get<TideEvent[]>('/events?status=live'),
  })
  const liveEvent = events[0] ?? null

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resources', liveEvent?.id, filterType, filterStatus],
    queryFn: () => {
      const p = new URLSearchParams()
      if (liveEvent) p.set('event_id', liveEvent.id)
      if (filterType) p.set('type', filterType)
      if (filterStatus) p.set('status', filterStatus)
      return api.get<Resource[]>(`/resources?${p}`)
    },
    enabled: !!liveEvent,
    refetchInterval: 15000,
  })

  const addMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/resources', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); setShowAdd(false); setNewResource({ name: '', type: 'personnel', call_sign: '', phone: '', location_zone: '' }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api.patch(`/resources/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/resources/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  })

  // Group by type
  const byType: Record<string, Resource[]> = {}
  for (const r of resources) {
    if (!byType[r.type]) byType[r.type] = []
    byType[r.type].push(r)
  }

  const summary = RESOURCE_TYPES.map(({ value, label, icon: Icon }) => {
    const group = byType[value] ?? []
    const available = group.filter(r => r.status === 'available').length
    return { value, label, Icon, total: group.length, available }
  }).filter(s => s.total > 0)

  return (
    <div className="flex flex-col h-full overflow-auto" style={{ background: '#0A0B0F' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h1 className="text-white font-bold text-lg">Resource Management</h1>
          <p className="text-white/30 text-xs">{resources.length} deployed · {resources.filter(r => r.status === 'available').length} available</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="">All Types</option>
            {RESOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="">All Statuses</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          {canManage && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white"
              style={{ background: '#E8521A' }}>
              <Plus size={14} /> Add Resource
            </button>
          )}
        </div>
      </div>

      {/* Summary tiles */}
      {summary.length > 0 && (
        <div className="flex gap-3 px-5 py-3 overflow-x-auto flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {summary.map(({ value, label, Icon, total, available }) => (
            <div key={value} className="flex items-center gap-3 px-4 py-3 rounded-xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Icon size={16} className="text-white/40" />
              <div>
                <p className="text-white text-sm font-bold">{available}<span className="text-white/30">/{total}</span></p>
                <p className="text-white/30 text-xs">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resource list */}
      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <div className="flex justify-center pt-8"><LoadingSpinner /></div>
        ) : !liveEvent ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/20">
            <Users size={32} className="mb-3" />
            <p className="text-sm">No live event active</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/20">
            <Users size={32} className="mb-3" />
            <p className="text-sm">No resources deployed</p>
            {canManage && (
              <button onClick={() => setShowAdd(true)}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: '#E8521A' }}>
                Add First Resource
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {resources.map(resource => {
              const sc = STATUS_COLORS[resource.status] ?? { bg: 'rgba(99,99,102,0.15)', text: '#636366' }
              const TypeInfo = RESOURCE_TYPES.find(t => t.value === resource.type)
              const Icon = TypeInfo?.icon ?? Users
              return (
                <div key={resource.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors hover:bg-white/3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)', width: 36, height: 36 }}>
                    <Icon size={16} className="text-white/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{resource.name}</span>
                      {resource.call_sign && (
                        <span className="text-white/30 text-xs font-mono">[{resource.call_sign}]</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-white/30 text-xs mt-0.5">
                      <span className="capitalize">{resource.type.replace(/_/g,' ')}</span>
                      {resource.location_zone && <><span>·</span><span>{resource.location_zone}</span></>}
                      {resource.assigned_cad_number && <><span>·</span><span className="font-mono text-orange-400">{resource.assigned_cad_number}</span></>}
                    </div>
                  </div>

                  {/* Status selector */}
                  {canManage ? (
                    <select
                      value={resource.status}
                      onChange={e => updateMutation.mutate({ id: resource.id, body: { status: e.target.value } })}
                      className="px-2 py-1 rounded-lg text-xs font-semibold outline-none cursor-pointer"
                      style={{ background: sc.bg, color: sc.text, border: 'none' }}>
                      {Object.entries(STATUS_COLORS).map(([s, c]) => (
                        <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ background: sc.bg, color: sc.text }}>
                      {resource.status.replace(/_/g,' ')}
                    </span>
                  )}

                  {canManage && (
                    <button
                      onClick={() => window.confirm('Remove this resource?') && deleteMutation.mutate(resource.id)}
                      className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add resource modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold">Add Resource</h2>
              <button onClick={() => setShowAdd(false)} className="text-white/40 hover:text-white/70">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/40 text-xs mb-1.5 block">Resource Name *</label>
                <input value={newResource.name} onChange={e => setNewResource(p => ({...p, name: e.target.value}))}
                  placeholder="e.g. Security Team Alpha"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1.5 block">Type *</label>
                <select value={newResource.type} onChange={e => setNewResource(p => ({...p, type: e.target.value as ResourceType}))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {RESOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">Call Sign</label>
                  <input value={newResource.call_sign} onChange={e => setNewResource(p => ({...p, call_sign: e.target.value}))}
                    placeholder="e.g. SEC-01"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">Zone</label>
                  <select value={newResource.location_zone} onChange={e => setNewResource(p => ({...p, location_zone: e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="">Select zone</option>
                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => liveEvent && addMutation.mutate({ ...newResource, event_id: liveEvent.id, tenant_id: liveEvent.tenant_id })}
                disabled={!newResource.name || addMutation.isPending}
                className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-40"
                style={{ background: '#E8521A' }}>
                {addMutation.isPending ? 'Adding…' : 'Add Resource'}
              </button>
              <button onClick={() => setShowAdd(false)}
                className="px-5 py-3 rounded-xl font-semibold text-white/50 hover:text-white/80 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
