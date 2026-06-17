import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { formatDateTime, exportCSV } from '../../lib/utils'
import type { AuditLog } from '../../types'

export function AdminAuditLog() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-log', fromDate, toDate],
    queryFn: async () => {
      let q = supabase
        .from('audit_log')
        .select('*, users(name, email), tenants(name)')
        .order('created_at', { ascending: false })
        .limit(500)

      if (fromDate) q = q.gte('created_at', fromDate)
      if (toDate) q = q.lte('created_at', toDate + 'T23:59:59')

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    }
  })

  function handleExport() {
    exportCSV(
      logs.map((l: Record<string, unknown>) => ({
        timestamp: l.created_at,
        user: (l.users as { email: string } | null)?.email ?? l.user_id,
        tenant: (l.tenants as { name: string } | null)?.name ?? l.tenant_id,
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
          { key: 'user', header: 'User', render: (row) => (row.users as { email: string } | null)?.email ?? String(row.user_id ?? '—') },
          { key: 'tenant', header: 'Tenant', render: (row) => (row.tenants as { name: string } | null)?.name ?? '—' },
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
