import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, File, CheckCircle, Clock, AlertTriangle, Download, Trash2, Plus, Search } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { TideEvent } from '../../types'

interface PlanningDoc {
  id: string
  event_id: string
  name: string
  category: string
  file_type: string
  status: 'approved' | 'pending' | 'expired' | 'draft'
  uploaded_by?: string
  created_at: string
  file_url?: string
}

const DOC_CATEGORIES = [
  { value: 'all',         label: 'All Documents' },
  { value: 'emp',         label: 'Event Management Plan' },
  { value: 'sag',         label: 'SAG Submission' },
  { value: 'rams',        label: 'RAMS' },
  { value: 'emergency',   label: 'Emergency Plans' },
  { value: 'insurance',   label: 'Insurance & Licences' },
  { value: 'risk',        label: 'Risk Assessments' },
  { value: 'comms',       label: 'Comms Plans' },
  { value: 'other',       label: 'Other' },
]

const STATUS_STYLES: Record<string, { bg: string; text: string; Icon: React.ElementType }> = {
  approved: { bg: 'rgba(52,199,89,0.1)',  text: '#34C759', Icon: CheckCircle },
  pending:  { bg: 'rgba(255,149,0,0.1)',  text: '#FF9500', Icon: Clock },
  expired:  { bg: 'rgba(255,59,48,0.1)',  text: '#FF3B30', Icon: AlertTriangle },
  draft:    { bg: 'rgba(99,99,102,0.1)',  text: '#636366', Icon: FileText },
}

function DocIcon({ fileType }: { fileType: string }) {
  const colors: Record<string, string> = { pdf: '#FF3B30', doc: '#2563EB', docx: '#2563EB', xls: '#16A34A', xlsx: '#16A34A', pptx: '#EA580C', jpg: '#7C3AED', png: '#7C3AED' }
  return (
    <div className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{ background: `${colors[fileType] ?? '#636366'}12`, width: 40, height: 40 }}>
      <File size={18} style={{ color: colors[fileType] ?? '#636366' }} />
    </div>
  )
}

export function PlanningDocuments() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const canEdit = user && ['client_admin', 'super_admin', 'tide_consultant', 'event_manager'].includes(user.role)

  const [selectedEvent, setSelectedEvent] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'emp', file_type: 'pdf', status: 'draft' as PlanningDoc['status'], notes: '' })

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => api.get<TideEvent[]>('/events') })
  const activeEvent = selectedEvent || events.find(e => e.status !== 'closed')?.id || ''

  const { data: docs = [], isLoading } = useQuery<PlanningDoc[]>({
    queryKey: ['planning-docs', activeEvent],
    queryFn: () => api.get<PlanningDoc[]>(`/documents?event_id=${activeEvent}`),
    enabled: !!activeEvent,
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/documents', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['planning-docs'] }); setShowUpload(false); setForm({ name: '', category: 'emp', file_type: 'pdf', status: 'draft', notes: '' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning-docs'] }),
  })

  const filtered = docs.filter(d => {
    const matchCat = activeCategory === 'all' || d.category === activeCategory
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const totalByStatus = { approved: 0, pending: 0, expired: 0, draft: 0 }
  for (const d of docs) { totalByStatus[d.status] = (totalByStatus[d.status] ?? 0) + 1 }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900" style={{ letterSpacing: '-0.03em' }}>Document Library</h1>
          <p className="text-gray-500 text-sm mt-1">{docs.length} documents · EMP, RAMS, SAG &amp; more</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none bg-white">
            <option value="">Select Event</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {canEdit && (
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{ background: '#E8521A' }}>
              <Upload size={15} /> Upload Doc
            </button>
          )}
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(Object.entries(totalByStatus) as [PlanningDoc['status'], number][]).map(([status, count]) => {
          const s = STATUS_STYLES[status]
          return (
            <div key={status} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl" style={{ background: s.bg, width: 36, height: 36 }}>
                <s.Icon size={16} style={{ color: s.text }} />
              </div>
              <div>
                <p className="font-extrabold text-gray-900 text-lg">{count}</p>
                <p className="text-xs font-semibold text-gray-400 capitalize">{status}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {DOC_CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setActiveCategory(cat.value)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={activeCategory === cat.value
              ? { background: '#E8521A', color: 'white' }
              : { background: '#F2F3F7', color: '#6B7280' }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white focus:border-orange-400" />
      </div>

      {/* Upload drop zone */}
      {canEdit && (
        <div className="mb-5 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-orange-300 transition-colors cursor-pointer"
          onClick={() => setShowUpload(true)}>
          <Upload size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-gray-400">Drag &amp; drop files or click to upload</p>
          <p className="text-xs text-gray-300 mt-1">PDF, DOCX, XLSX, PPTX, JPG, PNG supported</p>
        </div>
      )}

      {/* Document list */}
      {isLoading ? (
        <div className="flex justify-center py-12 text-gray-300">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-300">
          <FileText size={40} className="mb-3" />
          <p className="text-gray-400">No documents found</p>
          {canEdit && <button onClick={() => setShowUpload(true)} className="mt-3 text-xs font-semibold" style={{ color: '#E8521A' }}>Upload first document</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => {
            const s = STATUS_STYLES[doc.status]
            const catLabel = DOC_CATEGORIES.find(c => c.value === doc.category)?.label ?? doc.category
            return (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <DocIcon fileType={doc.file_type} />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span>{catLabel}</span>
                      <span>·</span>
                      <span className="uppercase font-semibold">{doc.file_type}</span>
                      <span>·</span>
                      <span>{new Date(doc.created_at).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: s.bg, color: s.text }}>
                    <s.Icon size={10} />
                    {doc.status}
                  </span>
                  {doc.file_url && (
                    <a href={doc.file_url} download className="text-gray-300 hover:text-blue-400 transition-colors">
                      <Download size={14} />
                    </a>
                  )}
                  {canEdit && (
                    <button onClick={() => window.confirm('Delete document?') && deleteMutation.mutate(doc.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Upload Document</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Document Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Event Management Plan v2.1"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400">
                    {DOC_CATEGORIES.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">File Type</label>
                  <select value={form.file_type} onChange={e => setForm(p => ({ ...p, file_type: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400">
                    {['pdf','docx','xlsx','pptx','jpg','png','other'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as PlanningDoc['status'] }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400">
                  <option value="draft">Draft</option>
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">File upload via Azure Blob Storage</p>
                <p className="text-xs text-gray-300 mt-1">Connect storage in environment settings</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { const ev = events.find(e => e.id === activeEvent); ev && createMutation.mutate({ ...form, event_id: activeEvent, tenant_id: ev.tenant_id }) }}
                disabled={!form.name || createMutation.isPending}
                className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-40"
                style={{ background: '#E8521A' }}>
                {createMutation.isPending ? 'Saving…' : 'Save Document'}
              </button>
              <button onClick={() => setShowUpload(false)} className="px-5 py-3 rounded-xl font-semibold text-gray-500"
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
