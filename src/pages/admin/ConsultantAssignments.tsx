import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserCheck } from 'lucide-react'
import { api } from '../../lib/api'
import type { User, Tenant } from '../../types'

export function ConsultantAssignments() {
  const { data: consultants = [] } = useQuery<User[]>({
    queryKey: ['consultants'],
    queryFn: () => api.get<User[]>('/users?role=tide_consultant'),
  })

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: () => api.get<Tenant[]>('/tenants'),
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Consultants</h1>
        <p className="text-sm text-gray-500 mt-0.5">{consultants.length} Tide consultant{consultants.length !== 1 ? 's' : ''}</p>
      </div>

      {consultants.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <UserCheck size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No consultants found. Create users with the tide_consultant role.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {consultants.map(c => (
            <div key={c.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-navy font-semibold text-sm">{c.name?.[0] ?? c.email[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy">{c.name ?? 'Unnamed'}</div>
                  <div className="text-sm text-gray-500">{c.email}</div>
                  {c.phone && <div className="text-sm text-gray-400 mt-0.5">{c.phone}</div>}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8521A]/10 text-[#E8521A] font-medium">Tide Consultant</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tenants.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-navy mb-4">All Clients</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Client', 'Type', 'Status', 'Contact'].map(h => (
                    <th key={h} className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-0">
                    <td className="py-3 px-4 font-medium text-navy">{t.name}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{t.type?.replace(/_/g, ' ') ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        t.status === 'active' ? 'bg-green-100 text-green-700' :
                        t.status === 'onboarding' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{t.status}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{t.primary_contact_email ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
