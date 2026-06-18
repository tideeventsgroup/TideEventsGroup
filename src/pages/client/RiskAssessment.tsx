import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, Plus, Download } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import type { Risk, Event } from '../../types'

function ragColor(score: number | null): string {
  if (score === null) return '#9ca3af'
  if (score <= 4) return '#16a34a'
  if (score <= 9) return '#d97706'
  return '#dc2626'
}

function ragLabel(score: number | null): string {
  if (score === null) return '—'
  if (score <= 4) return 'Low'
  if (score <= 9) return 'Medium'
  return 'High'
}

interface RiskForm {
  hazard: string
  who_at_risk: string
  controls: string
  likelihood: number
  severity: number
  responsible_person: string
  review_date: string
}

const emptyForm: RiskForm = {
  hazard: '',
  who_at_risk: '',
  controls: '',
  likelihood: 1,
  severity: 1,
  responsible_person: '',
  review_date: '',
}

export function RiskAssessment() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [selectedEventId, setSelectedEventId] = useState('')
  const [addForm, setAddForm] = useState<RiskForm>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<RiskForm>(emptyForm)

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get<Event[]>('/events'),
  })

  const { data: risks = [] } = useQuery<Risk[]>({
    queryKey: ['risks', selectedEventId],
    enabled: !!selectedEventId,
    queryFn: () => api.get<Risk[]>(`/risks?event_id=${selectedEventId}`),
  })

  const addMutation = useMutation({
    mutationFn: (body: RiskForm) =>
      api.post<Risk>('/risks', {
        ...body,
        event_id: selectedEventId,
        tenant_id: user?.tenant_id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['risks', selectedEventId] })
      setAddForm(emptyForm)
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: RiskForm }) =>
      api.patch<Risk>(`/risks/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['risks', selectedEventId] })
      setEditId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/risks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risks', selectedEventId] }),
  })

  function startEdit(risk: Risk) {
    setEditId(risk.id)
    setEditForm({
      hazard: risk.hazard,
      who_at_risk: risk.who_at_risk ?? '',
      controls: risk.existing_controls ?? '',
      likelihood: risk.likelihood ?? 1,
      severity: risk.severity ?? 1,
      responsible_person: risk.responsible_person ?? '',
      review_date: risk.review_date ?? '',
    })
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this risk? This cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  function exportCsv() {
    const header = ['#', 'Hazard', 'Who at Risk', 'Controls', 'L', 'S', 'Score', 'RAG', 'Responsible', 'Review Date']
    const rows = risks.map((r, i) => [
      i + 1,
      r.hazard,
      r.who_at_risk ?? '',
      r.existing_controls ?? '',
      r.likelihood ?? '',
      r.severity ?? '',
      r.risk_score ?? '',
      ragLabel(r.risk_score),
      r.responsible_person ?? '',
      r.review_date ?? '',
    ])
    const csv = [header, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'risk-register.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-navy">Risk Register</h1>
        <div className="flex items-center gap-3">
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy bg-white"
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
          >
            <option value="">Select event…</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
          {selectedEventId && (
            <button onClick={exportCsv} className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy bg-white hover:bg-gray-50">
              <Download size={15} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {!selectedEventId ? (
        <div className="card text-center text-gray-400 py-12">Select an event to view risks</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['#', 'Hazard', 'Who at Risk', 'Controls', 'L', 'S', 'Score', 'RAG', 'Responsible', 'Review Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {risks.map((risk, i) =>
                editId === risk.id ? (
                  <tr key={risk.id} className="border-b border-gray-100 bg-teal/5">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2"><input className="border border-gray-200 rounded px-2 py-1 text-sm w-full min-w-[120px]" value={editForm.hazard} onChange={e => setEditForm(f => ({ ...f, hazard: e.target.value }))} /></td>
                    <td className="px-3 py-2"><input className="border border-gray-200 rounded px-2 py-1 text-sm w-full min-w-[100px]" value={editForm.who_at_risk} onChange={e => setEditForm(f => ({ ...f, who_at_risk: e.target.value }))} /></td>
                    <td className="px-3 py-2"><input className="border border-gray-200 rounded px-2 py-1 text-sm w-full min-w-[120px]" value={editForm.controls} onChange={e => setEditForm(f => ({ ...f, controls: e.target.value }))} /></td>
                    <td className="px-3 py-2">
                      <select className="border border-gray-200 rounded px-1 py-1 text-sm" value={editForm.likelihood} onChange={e => setEditForm(f => ({ ...f, likelihood: Number(e.target.value) }))}>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select className="border border-gray-200 rounded px-1 py-1 text-sm" value={editForm.severity} onChange={e => setEditForm(f => ({ ...f, severity: Number(e.target.value) }))}>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 font-semibold">{editForm.likelihood * editForm.severity}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded text-white text-xs font-semibold" style={{ backgroundColor: ragColor(editForm.likelihood * editForm.severity) }}>
                        {ragLabel(editForm.likelihood * editForm.severity)}
                      </span>
                    </td>
                    <td className="px-3 py-2"><input className="border border-gray-200 rounded px-2 py-1 text-sm w-full min-w-[100px]" value={editForm.responsible_person} onChange={e => setEditForm(f => ({ ...f, responsible_person: e.target.value }))} /></td>
                    <td className="px-3 py-2"><input type="date" className="border border-gray-200 rounded px-2 py-1 text-sm" value={editForm.review_date} onChange={e => setEditForm(f => ({ ...f, review_date: e.target.value }))} /></td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button onClick={() => editMutation.mutate({ id: risk.id, body: editForm })} className="text-teal hover:underline text-xs font-medium mr-2">Save</button>
                      <button onClick={() => setEditId(null)} className="text-gray-400 hover:underline text-xs">Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={risk.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-navy">{risk.hazard}</td>
                    <td className="px-3 py-2.5 text-gray-600">{risk.who_at_risk ?? '—'}</td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-[200px] truncate">{risk.existing_controls ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center">{risk.likelihood ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center">{risk.severity ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center font-semibold">{risk.risk_score ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-white text-xs font-semibold" style={{ backgroundColor: ragColor(risk.risk_score) }}>
                        {ragLabel(risk.risk_score)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{risk.responsible_person ?? '—'}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{risk.review_date ?? '—'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <button onClick={() => startEdit(risk)} className="text-gray-400 hover:text-navy p-1"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(risk.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                )
              )}

              {/* Add row */}
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-3 py-2.5 text-gray-400"><Plus size={14} /></td>
                <td className="px-3 py-2"><input placeholder="Hazard" className="border border-gray-200 rounded px-2 py-1 text-sm w-full min-w-[120px]" value={addForm.hazard} onChange={e => setAddForm(f => ({ ...f, hazard: e.target.value }))} /></td>
                <td className="px-3 py-2"><input placeholder="Who at risk" className="border border-gray-200 rounded px-2 py-1 text-sm w-full min-w-[100px]" value={addForm.who_at_risk} onChange={e => setAddForm(f => ({ ...f, who_at_risk: e.target.value }))} /></td>
                <td className="px-3 py-2"><input placeholder="Controls" className="border border-gray-200 rounded px-2 py-1 text-sm w-full min-w-[120px]" value={addForm.controls} onChange={e => setAddForm(f => ({ ...f, controls: e.target.value }))} /></td>
                <td className="px-3 py-2">
                  <select className="border border-gray-200 rounded px-1 py-1 text-sm" value={addForm.likelihood} onChange={e => setAddForm(f => ({ ...f, likelihood: Number(e.target.value) }))}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select className="border border-gray-200 rounded px-1 py-1 text-sm" value={addForm.severity} onChange={e => setAddForm(f => ({ ...f, severity: Number(e.target.value) }))}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 font-semibold text-center">{addForm.likelihood * addForm.severity}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-white text-xs font-semibold" style={{ backgroundColor: ragColor(addForm.likelihood * addForm.severity) }}>
                    {ragLabel(addForm.likelihood * addForm.severity)}
                  </span>
                </td>
                <td className="px-3 py-2"><input placeholder="Responsible" className="border border-gray-200 rounded px-2 py-1 text-sm w-full min-w-[100px]" value={addForm.responsible_person} onChange={e => setAddForm(f => ({ ...f, responsible_person: e.target.value }))} /></td>
                <td className="px-3 py-2"><input type="date" className="border border-gray-200 rounded px-2 py-1 text-sm" value={addForm.review_date} onChange={e => setAddForm(f => ({ ...f, review_date: e.target.value }))} /></td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => addMutation.mutate(addForm)}
                    disabled={!addForm.hazard}
                    className="px-3 py-1.5 bg-teal text-white rounded text-xs font-medium disabled:opacity-50"
                  >
                    Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
