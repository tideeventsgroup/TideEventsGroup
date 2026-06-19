import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { api } from '../../lib/api'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { formatDateTime, exportCSV } from '../../lib/utils'
import type { AuditLog } from '../../types'

export function AdminAuditLog() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-log', fromDate, toDate],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '500' })
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      return api.get<Record<string, unknown>[]>(`/audit?${params}`)
    }
  })

  function handleExport() {
    exportCSV(
      logs.map((l: Record<string, unknown>) => ({
        timestamp: l.created_at,
        user: (l.user_email as string) ?? l.user_id,
        tenant: (l.tenant_name as string) ?? l.tenant_id,
        action: l.action,
        entity_type: l.entity_type,
        entity_id: l.entity_id,
      })),
      'tide-ims-audit-log.csv'
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Audit log</h1>
          <p className="text-sm text-gray-500 mt-1">All user actions across every tenant</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <div>
          <label className="label">From date</label>
          <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div>
          <label className="label">To date</label>
          <input type="date" className="input" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
      </div>

      <Table
        data={logs as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'created_at', header: 'Timestamp', sortable: true, render: (row) => formatDateTime(row.created_at as string) },
          { key: 'user_email', header: 'User', render: (row) => (row.user_email as string) ?? String(row.user_id ?? '—') },
          { key: 'tenant_name', header: 'Tenant', render: (row) => (row.tenant_name as string) ?? '—' },
          { key: 'action', header: 'Action' },
          { key: 'entity_type', header: 'Entity type' },
        ]}
        searchable
        searchKeys={['action', 'entity_type'] as never}
        emptyMessage="No audit log entries found."
      />
    </div>
  )
}
