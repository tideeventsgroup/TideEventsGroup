import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit2, Save, X, FileBarChart2 } from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { RiskAssessment } from './RiskAssessment'
import type { Event, Incident, Contractor, Document, MartynCompliance } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

const EVENT_STATUSES = ['planning', 'documentation', 'pre_event_review', 'live', 'post_event', 'closed'] as const
const SEVERITY_COLOURS: Record<string, string> = { critical: '#dc2626', high: '#f97316', medium: '#d97706', low: '#16a34a' }
const STATUS_COLOURS: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-600',
  documentation: 'bg-blue-100 text-blue-700',
  pre_event_review: 'bg-amber-100 text-amber-700',
  live: 'bg-red-100 text-red-700',
  post_event: 'bg-purple-100 text-purple-700',
  closed: 'bg-green-100 text-green-700',
}

export function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'overview' | 'risks' | 'documents' | 'contractors' | 'compliance' | 'incidents'>('overview')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Event>>({})

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ['event', id],
    enabled: !!id,
    queryFn: () => api.get<Event>(`/events/${id}`),
  })

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ['incidents', id],
    enabled: !!id && tab === 'incidents',
    queryFn: () => api.get<Incident[]>(`/incidents?event_id=${id}`),
  })

  const { data: contractors = [] } = useQuery<Contractor[]>({
    queryKey: ['contractors', id],
    enabled: !!id && tab === 'contractors',
    queryFn: () => api.get<Contractor[]>(`/contractors?event_id=${id}`),
  })

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ['documents-event', id],
    enabled: !!id && tab === 'documents',
    queryFn: () => api.get<Document[]>(`/documents?tenant_id=${user?.tenant_id}`),
  })

  const { data: compliance = [] } = useQuery<MartynCompliance[]>({
    queryKey: ['compliance', user?.tenant_id],
    enabled: !!user?.tenant_id && tab === 'compliance',
    queryFn: () => api.get<MartynCompliance[]>(`/compliance?tenant_id=${user!.tenant_id}`),
  })

  const updateEvent = useMutation({
    mutationFn: (data: Partial<Event>) => api.patch<Event>(`/events/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['event', id] }); setEditing(false) },
  })

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading…</div>
  if (!event) return <div className="p-8 text-center text-gray-400">Event not found</div>

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'risks', label: 'Risk Register' },
    { key: 'documents', label: 'Documents' },
    { key: 'contractors', label: 'Contractors' },
    { key: 'compliance', label: "Martyn's Law" },
    { key: 'incidents', label: 'Incidents' },
  ] as const

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/client/events')} className="text-gray-400 hover:text-navy transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-navy">{event.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOURS[event.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {event.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{event.venue_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(event.status === 'post_event' || event.status === 'closed') && (
            <Link to={`/client/events/${id}/report`}>
              <Button variant="outline" size="sm"><FileBarChart2 size={14} className="mr-1" />Report</Button>
            </Link>
          )}
          {event.status === 'live' && (
            <Link to="/client/live">
              <Button size="sm">Live Dashboard</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t.key ? 'border-[#E8521A] text-[#E8521A]' : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-navy">Event details</h2>
            {!editing ? (
              <button onClick={() => { setEditing(true); setEditForm(event) }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy">
                <Edit2 size={14} />Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => updateEvent.mutate(editForm)} className="flex items-center gap-1.5 text-sm text-[#E8521A] hover:text-orange-700">
                  <Save size={14} />Save
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy">
                  <X size={14} />Cancel
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Name', field: 'name' as const, type: 'text' },
              { label: 'Venue', field: 'venue_name' as const, type: 'text' },
              { label: 'Start date', field: 'start_date' as const, type: 'date' },
              { label: 'End date', field: 'end_date' as const, type: 'date' },
              { label: 'Expected attendance', field: 'expected_attendance' as const, type: 'number' },
              { label: 'Police liaison', field: 'police_liaison_name' as const, type: 'text' },
            ].map(({ label, field, type }) => (
              <div key={field}>
                <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
                {editing ? (
                  <input
                    type={type}
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                    value={(editForm[field] as string) ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, [field]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                  />
                ) : (
                  <div className="text-sm text-navy">{(event[field] as string) ?? '—'}</div>
                )}
              </div>
            ))}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Status</div>
              {editing ? (
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                  value={editForm.status ?? event.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value as Event['status'] }))}
                >
                  {EVENT_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              ) : (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOURS[event.status]}`}>
                  {event.status.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Licensed event</div>
              <div className="text-sm text-navy">{event.licensed ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">SAG involvement</div>
              <div className="text-sm text-navy">{event.sag_involvement ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Register tab */}
      {tab === 'risks' && <RiskAssessment />}

      {/* Documents tab */}
      {tab === 'documents' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {documents.filter(d => d.event_id === id).length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No documents for this event</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Title', 'Type', 'Status', 'Version', 'Date'].map(h => (
                    <th key={h} className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.filter(d => d.event_id === id).map(doc => (
                  <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-navy">{doc.title}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{doc.type.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc.status === 'final' ? 'bg-green-100 text-green-700' : doc.status === 'submitted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">v{doc.version}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(doc.created_at).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Contractors tab */}
      {tab === 'contractors' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {contractors.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No contractors assigned to this event</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Company', 'Type', 'Contact', 'SIA Licence', 'Status'].map(h => (
                    <th key={h} className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contractors.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-navy">{c.company_name}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{c.type?.replace(/_/g, ' ') ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{c.primary_contact_name ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs">{c.sia_licence_number ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.archived ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                        {c.archived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Compliance tab */}
      {tab === 'compliance' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {compliance.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No compliance items tracked yet. Visit the Martyn's Law page to update.</p>
          ) : (
            <div className="space-y-2">
              {compliance.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-navy capitalize">{item.item_key.replace(/_/g, ' ')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.status === 'complete' ? 'bg-green-100 text-green-700' : item.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Incidents tab */}
      {tab === 'incidents' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {incidents.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No incidents logged for this event</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Ref', 'Category', 'Severity', 'Status', 'Zone', 'Logged'].map(h => (
                    <th key={h} className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidents.map(inc => (
                  <tr key={inc.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{inc.reference_number ?? '—'}</td>
                    <td className="py-3 px-4 text-navy capitalize">{inc.category?.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4">
                      {inc.severity && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: SEVERITY_COLOURS[inc.severity] + '20', color: SEVERITY_COLOURS[inc.severity] }}>
                          {inc.severity}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inc.status === 'resolved' ? 'bg-green-100 text-green-700' : inc.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {inc.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{inc.location_zone ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(inc.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
