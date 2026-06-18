import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Table } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { formatDate } from '../../lib/utils'
import type { User } from '../../types'

export function AdminUsers() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.get<Record<string, unknown>[]>('/users'),
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-navy">Users</h1>
        <p className="text-sm text-gray-500 mt-1">{users.length} users across all tenants</p>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4">
          <Table
            data={users as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'name', header: 'Name', sortable: true },
              { key: 'email', header: 'Email', sortable: true },
              { key: 'role', header: 'Role', render: (row) => <StatusBadge status={row.role as string} /> },
              { key: 'tenant_name', header: 'Client', render: (row) => (row.tenant_name as string) ?? 'N/A' },
              { key: 'created_at', header: 'Joined', render: (row) => formatDate(row.created_at as string) },
            ]}
            searchable
            searchKeys={['name', 'email'] as never}
            emptyMessage="No users found."
          />
        </div>
      </div>
    </div>
  )
}
