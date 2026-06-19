import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Download, History, FileText } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Select, Input } from '../../components/ui/Input'
import { formatDate } from '../../lib/utils'
import type { Document, DocumentType } from '../../types'

const docTypeOptions: { value: DocumentType; label: string }[] = [
  { value: 'ossp', label: 'OSSP' },
  { value: 'terrorism_risk_plan', label: 'Terrorism risk plan' },
  { value: 'fire_management_plan', label: 'Fire management plan' },
  { value: 'risk_assessment', label: 'Risk assessment' },
  { value: 'sag_submission', label: 'SAG submission pack' },
  { value: 'briefing', label: 'Staff briefing' },
  { value: 'other', label: 'Other' },
]

const docTypeLabels: Record<string, string> = {
  ossp: 'OSSP',
  terrorism_risk_plan: 'Terrorism risk plan',
  fire_management_plan: 'Fire management plan',
  risk_assessment: 'Risk assessment',
  sag_submission: 'SAG submission pack',
  briefing: 'Staff briefing',
  other: 'Other',
}

export function DocumentVault() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<DocumentType>('ossp')

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', user?.tenant_id],
    enabled: !!user?.tenant_id,
    queryFn: async () => {
      return api.get<Document[]>(`/documents?tenant_id=${user!.tenant_id!}`)
    }
  })

  const createDoc = useMutation({
    mutationFn: async () => {
      await api.post('/documents', {
        tenant_id: user!.tenant_id!,
        title: newTitle,
        type: newType,
        status: 'draft',
        version: 1,
        content_json: {},
        created_by: user!.id,
      })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); setAddOpen(false); setNewTitle('') }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Document vault</h1>
          <p className="text-sm text-gray-500 mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          New document
        </Button>
      </div>

      <Table
        data={documents as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'title', header: 'Title', sortable: true, render: (row) => (
            <span className="flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              {row.title as string}
            </span>
          )},
          { key: 'type', header: 'Type', render: (row) => docTypeLabels[row.type as string] ?? String(row.type) },
          { key: 'version', header: 'Version', render: (row) => `v${row.version}` },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status as string} /> },
          { key: 'created_at', header: 'Created', sortable: true, render: (row) => formatDate(row.created_at as string) },
          {
            key: 'actions', header: '', render: (row) => (
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Download PDF">
                  <Download size={16} />
                </button>
                <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Version history">
                  <History size={16} />
                </button>
              </div>
            )
          },
        ]}
        searchable
        searchKeys={['title'] as never}
        emptyMessage="No documents yet. Create your first document."
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New document">
        <div className="space-y-4">
          <Input label="Document title" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. 2024 Summer Festival OSSP" />
          <Select
            label="Document type"
            options={docTypeOptions}
            value={newType}
            onChange={e => setNewType(e.target.value as DocumentType)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => createDoc.mutate()} loading={createDoc.isPending} disabled={!newTitle}>Create document</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
