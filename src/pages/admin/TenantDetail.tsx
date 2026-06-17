import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Building2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { StatusBadge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { formatDate } from '../../lib/utils'
import type { Tenant, Event, User } from '../../types'

type Tab = 'overview' | 'events' | 'users'

export function TenantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('tenants').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Tenant
    }
  })

  const { data: events = [] } = useQuery({
    queryKey: ['tenant-events', id],
    enabled: tab === 'events',
    queryFn: async () => {
      const { data } = await supabase.from('events').select('*').eq('tenant_id', id!).order('start_date', { ascending: false })
      return (data ?? []) as Event[]
    }
  })

  const { data: users = [] } = useQuery({
    queryKey: ['tenant-users', id],
    enabled: tab === 'users',
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*').eq('tenant_id', id!)
      return (data ?? []) as User[]
    }
  })

  if (isLoading) return <LoadingSpinner />
  if (!tenant) return <div className="text-gray-500">Client not found.</div>

  return (
    <div>
      <button onClick={() => navigate('/admin/clients')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to clients
      </button>

      <div className="flex items-start gap-4 mb-6">
        <div className="h-12 w-12 rounded-lg bg-navy/10 flex items-center justify-center flex-shrink-0">
          <Building2 size={24} className="text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy">{tenant.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={tenant.status} />
            <span className="text-sm text-gray-500">Created {formatDate(tenant.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {(['overview', 'events', 'users'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${tab === t ? 'border-teal text-teal' : 'border-transparent text-gray-500 hover:text-navy'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="card">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Organisation type', tenant.type?.replace(/_/g, ' ') ?? '—'],
              ['Licence tier', tenant.licence_tier?.replace('_', ' ') ?? '—'],
              ['Primary contact', tenant.primary_contact_name ?? '—'],
              ['Email', tenant.primary_contact_email ?? '—'],
              ['Phone', tenant.primary_contact_phone ?? '—'],
              ['Registered address', tenant.registered_address ?? '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium text-gray-500">{label}</dt>
                <dd className="text-sm text-navy mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {tab === 'events' && (
        <Table
          data={events as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'name', header: 'Event name', sortable: true },
            { key: 'type', header: 'Type', render: (row) => (row.type as string)?.replace(/_/g, ' ') ?? '—' },
            { key: 'start_date', header: 'Date', render: (row) => formatDate(row.start_date as string) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status as string} /> },
          ]}
          emptyMessage="No events for this client."
        />
      )}

      {tab === 'users' && (
        <Table
          data={users as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'name', header: 'Name', sortable: true },
            { key: 'email', header: 'Email', sortable: true },
            { key: 'role', header: 'Role', render: (row) => (row.role as string)?.replace(/_/g, ' ') ?? '—' },
            { key: 'created_at', header: 'Joined', render: (row) => formatDate(row.created_at as string) },
          ]}
          emptyMessage="No users for this client."
        />
      )}
    </div>
  )
}
