import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Plus, Trash2, Edit2, Save, X, Filter, Download } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { TideEvent, Risk } from '../../types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const CATEGORIES = ['Crowd Management','Medical','Security','Fire','Structural','Environmental','CT','Infrastructure','Welfare','Transport','Other']

function RiskScore({ score }: { score: number | null }) {
  if (!score) return <span className="text-gray-300 text-xs">—</span>
  const c = score >= 15 ? '#FF3B30' : score >= 8 ? '#FF9500' : '#34C759'
  const label = score >= 15 ? 'High' : score >= 8 ? 'Medium' : 'Low'
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center justify-center rounded-lg font-black text-sm text-white w-8 h-8"
        style={{ background: c }}>{score}</span>
      <span className="text-xs font-semibold" style={{ color: c }}>{label}</span>
    </div>
  )
}

function LikelihoodImpactPicker({ value, onChange, max = 5 }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className="h-7 w-7 rounded-lg text-xs font-bold transition-all"
          style={{
            background: n <= value ? (value >= 4 ? '#FF3B30' : value === 3 ? '#FF9500' : '#34C759') : 'rgba(0,0,0,0.06)',
            color: n <= value ? 'white' : '#9CA3AF',
          }}>
          {n}
        </button>
      ))}
    </div>
  )
}

export function PlanningRiskRegister() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const canEdit = user && ['silver_command','event_manager','client_admin','super_admin','tide_consultant'].includes(user.role)

  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [filterCat, setFilterCat] = useState('')
  const [showHigh, setShowHigh] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const emptyForm = {
    hazard: '', category: '', who_at_risk: '', existing_controls: '',
    likelihood: 3, impact: 3, additional_controls: '', owner: '', review_date: '',
  }
  const [form, setForm] = useState({ ...emptyForm })

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get<TideEvent[]>('/events'),
  })

  const activeEvent = selectedEvent || events.find(e => e.status !== 'closed')?.id || ''

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risks', activeEvent],
    queryFn: () => api.get<Risk[]>(`/risks?event_id=${activeEvent}`),
    enabled: !!activeEvent,
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/risks', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risks'] }); setShowAdd(false); setForm({ ...emptyForm }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api.patch(`/risks/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risks'] }); setEditId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/risks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risks'] }),
  })

  const filtered = risks.filter(r => {
    if (filterCat && r.category !== filterCat) return false
    if (showHigh && (r.risk_score ?? 0) < 15) return false
    return true
  }).sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))

  function submitForm() {
    const event = events.find(e => e.id === activeEvent)
    if (!event) return
    const body = { ...form, event_id: activeEvent, tenant_id: event.tenant_id }
    if (editId) { updateMutation.mutate({ id: editId, body }) }
    else { createMutation.mutate(body) }
  }

  function startEdit(risk: Risk) {
    setEditId(risk.id)
    setForm({
      hazard: risk.hazard,
      category: risk.category ?? '',
      who_at_risk: risk.who_at_risk ?? '',
      existing_controls: risk.existing_controls ?? '',
      likelihood: risk.likelihood ?? 3,
      impact: risk.impact ?? 3,
      additional_controls: risk.additional_controls ?? '',
      owner: risk.owner ?? '',
      review_date: risk.review_date ?? '',
    })
    setShowAdd(true)
  }

  function exportCSV() {
    const header = ['Hazard','Category','Who at Risk','Controls','Likelihood','Impact','Score','Level','Owner','Review Date']
    const rows = filtered.map(r => [
      r.hazard, r.category ?? '', r.who_at_risk ?? '', r.existing_controls ?? '',
      r.likelihood ?? '', r.impact ?? '', r.risk_score ?? '',
      (r.risk_score ?? 0) >= 15 ? 'High' : (r.risk_score ?? 0) >= 8 ? 'Medium' : 'Low',
      r.owner ?? '', r.review_date ?? '',
    ])
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `risk-register-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const highCount = risks.filter(r => (r.risk_score ?? 0) >= 15).length
  const medCount = risks.filter(r => { const s = r.risk_score ?? 0; return s >= 8 && s < 15 }).length

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900" style={{ letterSpacing: '-0.03em' }}>Risk Register</h1>
          <p className="text-gray-500 text-sm mt-1">
            {risks.length} risks · <span style={{ color: '#FF3B30' }}>{highCount} high</span> · <span style={{ color: '#FF9500' }}>{medCount} medium</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 bg-white">
            <Download size={13} /> Export
          </button>
          {canEdit && (
            <button onClick={() => { setEditId(null); setForm({ ...emptyForm }); setShowAdd(true) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{ background: '#E8521A' }}>
              <Plus size={15} /> Add Risk
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-orange-400 bg-white">
          <option value="">All Events</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-orange-400 bg-white">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowHigh(h => !h)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
          style={{
            background: showHigh ? 'rgba(255,59,48,0.08)' : 'white',
            borderColor: showHigh ? 'rgba(255,59,48,0.3)' : '#E5E7EB',
            color: showHigh ? '#FF3B30' : '#6B7280',
          }}>
          <AlertTriangle size={13} /> High Risk Only
        </button>
      </div>

      {/* Risk matrix legend */}
      <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-white border border-gray-100">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk Score:</span>
        {[{ label: '1–7 Low', color: '#34C759' }, { label: '8–14 Medium', color: '#FF9500' }, { label: '15–25 High', color: '#FF3B30' }].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded" style={{ background: color }} />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
        <span className="text-xs text-gray-400 ml-2">= Likelihood (1–5) × Impact (1–5)</span>
      </div>

      {/* Table */}
      {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-300">
          <AlertTriangle size={40} className="mb-3" />
          <p className="text-gray-400">No risks found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                {['Hazard','Category','Who at Risk','Controls','L','I','Score','Owner','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(risk => (
                <tr key={risk.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900 max-w-48">
                    <p className="truncate">{risk.hazard}</p>
                    {risk.flagged_high && <span className="text-xs font-bold" style={{ color: '#FF3B30' }}>⚠ Flagged</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{risk.category ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-32 truncate">{risk.who_at_risk ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-48 truncate">{risk.existing_controls ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center justify-center h-6 w-6 rounded font-bold text-xs text-white"
                      style={{ background: (risk.likelihood ?? 1) >= 4 ? '#FF3B30' : (risk.likelihood ?? 1) >= 3 ? '#FF9500' : '#34C759' }}>
                      {risk.likelihood ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center justify-center h-6 w-6 rounded font-bold text-xs text-white"
                      style={{ background: (risk.impact ?? 1) >= 4 ? '#FF3B30' : (risk.impact ?? 1) >= 3 ? '#FF9500' : '#34C759' }}>
                      {risk.impact ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3"><RiskScore score={risk.risk_score} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{risk.owner ?? '—'}</td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(risk)} className="text-gray-400 hover:text-gray-700 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => window.confirm('Delete this risk?') && deleteMutation.mutate(risk.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-auto" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">{editId ? 'Edit Risk' : 'Add Risk'}</h2>
              <button onClick={() => { setShowAdd(false); setEditId(null) }} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Hazard *</label>
                <input value={form.hazard} onChange={e => setForm(p => ({...p, hazard: e.target.value}))}
                  placeholder="Describe the hazard"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400">
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Who at Risk</label>
                  <input value={form.who_at_risk} onChange={e => setForm(p => ({...p, who_at_risk: e.target.value}))}
                    placeholder="e.g. Audience, Staff"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Existing Controls</label>
                <textarea value={form.existing_controls} onChange={e => setForm(p => ({...p, existing_controls: e.target.value}))}
                  rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Likelihood (1–5)</label>
                  <LikelihoodImpactPicker value={form.likelihood} onChange={v => setForm(p => ({...p, likelihood: v}))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Impact (1–5)</label>
                  <LikelihoodImpactPicker value={form.impact} onChange={v => setForm(p => ({...p, impact: v}))} />
                </div>
              </div>
              <div className="px-4 py-3 rounded-xl text-center" style={{ background: (form.likelihood * form.impact) >= 15 ? 'rgba(255,59,48,0.08)' : (form.likelihood * form.impact) >= 8 ? 'rgba(255,149,0,0.08)' : 'rgba(52,199,89,0.08)' }}>
                <span className="text-xs text-gray-500">Risk Score: </span>
                <span className="font-black text-xl" style={{ color: (form.likelihood * form.impact) >= 15 ? '#FF3B30' : (form.likelihood * form.impact) >= 8 ? '#FF9500' : '#34C759' }}>
                  {form.likelihood * form.impact}
                </span>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Additional Controls</label>
                <textarea value={form.additional_controls} onChange={e => setForm(p => ({...p, additional_controls: e.target.value}))}
                  rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Owner</label>
                  <input value={form.owner} onChange={e => setForm(p => ({...p, owner: e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Review Date</label>
                  <input type="date" value={form.review_date} onChange={e => setForm(p => ({...p, review_date: e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-orange-400" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={submitForm} disabled={!form.hazard || createMutation.isPending || updateMutation.isPending}
                className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-40"
                style={{ background: '#E8521A' }}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving…' : editId ? 'Update Risk' : 'Add Risk'}
              </button>
              <button onClick={() => { setShowAdd(false); setEditId(null) }}
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
