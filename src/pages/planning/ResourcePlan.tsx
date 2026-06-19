import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, Trash2, Building } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { TideEvent, Contractor, ContractorType } from '../../types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const CONTRACTOR_TYPES: { value: ContractorType; label: string; color: string }[] = [
  { value: 'security', label: 'Security', color: '#FF9500' },
  { value: 'stewarding', label: 'Stewarding', color: '#5B8CFF' },
  { value: 'medical', label: 'Medical', color: '#FF3B30' },
  { value: 'fire_safety', label: 'Fire Safety', color: '#FF3B30' },
  { value: 'traffic_management', label: 'Traffic Mgmt', color: '#FFCC00' },
  { value: 'infrastructure', label: 'Infrastructure', color: '#4ECDC4' },
  { value: 'other', label: 'Other', color: '#636366' },
]

export function PlanningResourcePlan() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const canEdit = user && ['silver_command','event_manager','client_admin','super_admin','tide_consultant'].includes(user.role)

  const [selectedEvent, setSelectedEvent] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ company_name: '', type: 'security' as ContractorType, headcount: '', primary_contact_name: '', primary_contact_phone: '', sia_licence_number: '', sia_expiry_date: '' })

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => api.get<TideEvent[]>('/events') })
  const activeEvent = selectedEvent || events.find(e => e.status !== 'closed')?.id || ''

  const { data: contractors = [], isLoading } = useQuery({
    queryKey: ['contractors', activeEvent],
    queryFn: () => api.get<Contractor[]>(`/contractors?event_id=${activeEvent}`),
    enabled: !!activeEvent,
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/contractors', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contractors'] }); setShowAdd(false); setForm({ company_name: '', type: 'security', headcount: '', primary_contact_name: '', primary_contact_phone: '', sia_licence_number: '', sia_expiry_date: '' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/contractors/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contractors'] }),
  })

  const byType: Record<string, Contractor[]> = {}
  for (const c of contractors.filter(c => !c.archived)) {
    if (!byType[c.type ?? 'other']) byType[c.type ?? 'other'] = []
    byType[c.type ?? 'other'].push(c)
  }

  const totalHeadcount = contractors.filter(c => !c.archived).reduce((sum, c) => sum + (c.headcount ?? 0), 0)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900" style={{ letterSpacing: '-0.03em' }}>Resource Planning</h1>
          <p className="text-gray-500 text-sm mt-1">{contractors.filter(c => !c.archived).length} contractors · {totalHeadcount} total headcount</p>
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
              <Plus size={15} /> Add Contractor
            </button>
          )}
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        {CONTRACTOR_TYPES.map(({ value, label, color }) => {
          const group = byType[value] ?? []
          const hc = group.reduce((s, c) => s + (c.headcount ?? 0), 0)
          return (
            <div key={value} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <p className="font-black text-xl" style={{ color: group.length ? color : '#E5E7EB' }}>{hc}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          )
        })}
      </div>

      {/* Contractor list */}
      {isLoading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {Object.entries(byType).map(([type, list]) => {
            const typeInfo = CONTRACTOR_TYPES.find(t => t.value === type)
            return (
              <div key={type}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: typeInfo?.color ?? '#636366' }}>{typeInfo?.label ?? type}</p>
                <div className="space-y-2">
                  {list.map(contractor => (
                    <div key={contractor.id}
                      className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-xl"
                          style={{ background: `${typeInfo?.color ?? '#636366'}12`, width: 40, height: 40 }}>
                          <Building size={16} style={{ color: typeInfo?.color ?? '#636366' }} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{contractor.company_name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                            {contractor.headcount > 0 && <span><Users size={10} className="inline mr-1" />{contractor.headcount} staff</span>}
                            {contractor.primary_contact_name && <span>{contractor.primary_contact_name}</span>}
                            {contractor.primary_contact_phone && <span>{contractor.primary_contact_phone}</span>}
                          </div>
                        </div>
                      </div>
                      {canEdit && (
                        <button onClick={() => window.confirm('Remove contractor?') && deleteMutation.mutate(contractor.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {Object.keys(byType).length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-300">
              <Users size={40} className="mb-3" />
              <p className="text-gray-400">No contractors added yet</p>
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Add Contractor</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Company Name *</label>
                <input value={form.company_name} onChange={e => setForm(p => ({...p, company_name: e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value as ContractorType}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400">
                    {CONTRACTOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Headcount</label>
                  <input type="number" value={form.headcount} onChange={e => setForm(p => ({...p, headcount: e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Contact Name</label>
                <input value={form.primary_contact_name} onChange={e => setForm(p => ({...p, primary_contact_name: e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Contact Phone</label>
                <input value={form.primary_contact_phone} onChange={e => setForm(p => ({...p, primary_contact_phone: e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { const ev = events.find(e => e.id === activeEvent); ev && createMutation.mutate({ ...form, event_id: activeEvent, tenant_id: ev.tenant_id, headcount: form.headcount ? parseInt(form.headcount) : 0 }) }}
                disabled={!form.company_name || createMutation.isPending}
                className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-40"
                style={{ background: '#E8521A' }}>
                {createMutation.isPending ? 'Adding…' : 'Add Contractor'}
              </button>
              <button onClick={() => setShowAdd(false)}
                className="px-5 py-3 rounded-xl font-semibold text-gray-500"
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
