import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Printer } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { Event, Incident, Contractor, MartynCompliance } from '../../types'

const CATEGORIES = ['medical','security','crowd_pressure','fire_evacuation','ct_concern','suspicious_behaviour','lost_person','infrastructure','noise_nuisance','near_miss','other']
const SEVERITIES = ['critical','high','medium','low'] as const
const SEV_COLOURS: Record<string, string> = { critical: '#dc2626', high: '#f97316', medium: '#d97706', low: '#16a34a' }

export function PostEventReport() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: event } = useQuery<Event>({ queryKey: ['event', id], enabled: !!id, queryFn: () => api.get<Event>(`/events/${id}`) })
  const { data: incidents = [] } = useQuery<Incident[]>({ queryKey: ['incidents', id], enabled: !!id, queryFn: () => api.get<Incident[]>(`/incidents?event_id=${id}`) })
  const { data: contractors = [] } = useQuery<Contractor[]>({ queryKey: ['contractors', id], enabled: !!id, queryFn: () => api.get<Contractor[]>(`/contractors?event_id=${id}`) })
  const { data: compliance = [] } = useQuery<MartynCompliance[]>({ queryKey: ['compliance', user?.tenant_id], enabled: !!user?.tenant_id, queryFn: () => api.get<MartynCompliance[]>(`/compliance?tenant_id=${user!.tenant_id}`) })

  if (!event) return <div className="p-8 text-center text-gray-400">Loading…</div>

  const resolved = incidents.filter(i => i.status === 'resolved')
  const resolutionRate = incidents.length > 0 ? Math.round((resolved.length / incidents.length) * 100) : 0
  const compliantItems = compliance.filter(c => c.status === 'complete')
  const compliancePct = compliance.length > 0 ? Math.round((compliantItems.length / compliance.length) * 100) : 0

  const avgResolveMs = resolved.length > 0
    ? resolved.reduce((sum, i) => {
        if (!i.resolved_at) return sum
        return sum + (new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime())
      }, 0) / resolved.length
    : 0
  const avgResolveMin = Math.round(avgResolveMs / 60000)

  return (
    <div>
      <style>{`@media print { .no-print { display: none !important } }`}</style>

      <div className="flex items-center justify-between mb-6 no-print">
        <button onClick={() => navigate(`/client/events/${id}`)} className="flex items-center gap-2 text-gray-500 hover:text-navy">
          <ArrowLeft size={18} />Back
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90">
          <Printer size={16} />Print / Export PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#E8521A] mb-2">Post-Event Report</div>
              <h1 className="text-3xl font-bold text-navy">{event.name}</h1>
              <p className="text-gray-500 mt-1">{event.venue_name}</p>
            </div>
            <img src="/logo-white.png" alt="Tide Events Group" className="h-8 opacity-20 no-print" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            {[
              { label: 'Start', value: event.start_date ? new Date(event.start_date).toLocaleDateString('en-GB') : '—' },
              { label: 'End', value: event.end_date ? new Date(event.end_date).toLocaleDateString('en-GB') : '—' },
              { label: 'Expected attendance', value: event.expected_attendance?.toLocaleString() ?? '—' },
              { label: 'Status', value: event.status.replace(/_/g, ' ') },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</div>
                <div className="text-sm font-semibold text-navy mt-0.5 capitalize">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total incidents', value: incidents.length, colour: '#111111' },
            { label: 'Resolution rate', value: `${resolutionRate}%`, colour: '#16a34a' },
            { label: 'Avg resolve time', value: avgResolveMin > 0 ? `${avgResolveMin}m` : '—', colour: '#E8521A' },
            { label: 'Compliance', value: `${compliancePct}%`, colour: '#2563eb' },
          ].map(({ label, value, colour }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <div className="text-2xl font-bold" style={{ color: colour }}>{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Section 1: Incident summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-navy mb-4">1. Incident Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">By Severity</h3>
              {SEVERITIES.map(sev => {
                const count = incidents.filter(i => i.severity === sev).length
                const pct = incidents.length > 0 ? (count / incidents.length) * 100 : 0
                return (
                  <div key={sev} className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium" style={{ color: SEV_COLOURS[sev] }}>{sev}</span>
                      <span className="text-gray-600">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: SEV_COLOURS[sev] }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">By Category</h3>
              {CATEGORIES.map(cat => {
                const count = incidents.filter(i => i.category === cat).length
                if (count === 0) return null
                return (
                  <div key={cat} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-600 capitalize">{cat.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-navy">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Key incidents */}
        {incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-lg font-bold text-navy mb-4">2. Key Incidents (Critical &amp; High)</h2>
            <div className="space-y-3">
              {incidents.filter(i => i.severity === 'critical' || i.severity === 'high').map(inc => (
                <div key={inc.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-400">{inc.reference_number}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: SEV_COLOURS[inc.severity!] + '20', color: SEV_COLOURS[inc.severity!] }}>{inc.severity}</span>
                    <span className="text-xs text-gray-500 capitalize">{inc.category?.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-sm text-navy">{inc.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>{inc.location_zone}</span>
                    <span>{new Date(inc.created_at).toLocaleString('en-GB')}</span>
                    <span className={`capitalize font-medium ${inc.status === 'resolved' ? 'text-green-600' : 'text-amber-600'}`}>{inc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Contractors */}
        {contractors.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-lg font-bold text-navy mb-4">3. Contractors</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{['Company', 'Type', 'Contact', 'SIA Licence'].map(h => <th key={h} className="text-left py-2 font-semibold text-gray-500 text-xs uppercase tracking-wider pr-4">{h}</th>)}</tr></thead>
              <tbody>
                {contractors.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-4 font-medium text-navy">{c.company_name}</td>
                    <td className="py-2 pr-4 text-gray-600 capitalize">{c.type?.replace(/_/g, ' ') ?? '—'}</td>
                    <td className="py-2 pr-4 text-gray-600">{c.primary_contact_name ?? '—'}</td>
                    <td className="py-2 font-mono text-xs text-gray-500">{c.sia_licence_number ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section 4: Compliance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-navy mb-2">4. Martyn's Law Compliance</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-3 bg-gray-100 rounded-full">
              <div className="h-3 rounded-full bg-[#E8521A] transition-all" style={{ width: `${compliancePct}%` }} />
            </div>
            <span className="text-sm font-bold text-navy">{compliancePct}%</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {compliance.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${item.status === 'complete' ? 'bg-green-500' : item.status === 'in_progress' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                <span className="text-gray-600 capitalize text-xs">{item.item_key.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 py-4">
          Generated by Tide IMS · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  )
}
