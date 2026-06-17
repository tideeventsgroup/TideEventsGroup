import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, PauseCircle, Archive } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { ConfirmModal } from '../../components/shared/ConfirmModal'
import { StatusBadge } from '../../components/ui/Badge'
import { formatDate } from '../../lib/utils'
import type { Tenant } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'Company name is required'),
  primary_contact_name: z.string().min(1, 'Contact name is required'),
  primary_contact_email: z.string().email('Valid email required'),
  primary_contact_phone: z.string().min(1, 'Phone is required'),
  type: z.string().min(1, 'Type is required'),
  licence_tier: z.enum(['per_event', 'annual']),
})

type FormData = z.infer<typeof schema>

export function AdminTenants() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'suspend' | 'archive'; tenant: Tenant } | null>(null)

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Tenant[]
    }
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { licence_tier: 'per_event' }
  })

  const createTenant = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.from('tenants').insert({
        name: data.name,
        primary_contact_name: data.primary_contact_name,
        primary_contact_email: data.primary_contact_email,
        primary_contact_phone: data.primary_contact_phone,
        type: data.type,
        licence_tier: data.licence_tier,
        status: 'onboarding',
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      reset()
      setAddOpen(false)
    }
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('tenants').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); setConfirmAction(null) }
  })

  const columns = [
    { key: 'name', header: 'Company name', sortable: true },
    { key: 'type', header: 'Type', sortable: true, render: (row: Tenant) => row.type?.replace('_', ' ') ?? '—' },
    { key: 'licence_tier', header: 'Licence', render: (row: Tenant) => row.licence_tier?.replace('_', ' ') ?? '—' },
    { key: 'status', header: 'Status', render: (row: Tenant) => <StatusBadge status={row.status} /> },
    { key: 'created_at', header: 'Created', sortable: true, render: (row: Tenant) => formatDate(row.created_at) },
    {
      key: 'actions', header: '', render: (row: Tenant) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="View" onClick={() => navigate(`/admin/clients/${row.id}`)}>
            <Eye size={16} />
          </button>
          {row.status !== 'suspended' && (
            <button className="p-1.5 rounded hover:bg-gray-100 text-amber" title="Suspend" onClick={() => setConfirmAction({ type: 'suspend', tenant: row })}>
              <PauseCircle size={16} />
            </button>
          )}
          <button className="p-1.5 rounded hover:bg-gray-100 text-danger" title="Archive" onClick={() => setConfirmAction({ type: 'archive', tenant: row })}>
            <Archive size={16} />
          </button>
        </div>
      )
    },
  ]

  const typeOptions = [
    { value: 'festival', label: 'Festival' },
    { value: 'venue', label: 'Venue' },
    { value: 'local_authority', label: 'Local authority' },
    { value: 'charity', label: 'Charity' },
    { value: 'private_event_company', label: 'Private event company' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{tenants.length} client{tenants.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          Add client
        </Button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <Table
            data={tenants as unknown as Record<string, unknown>[]}
            columns={columns as never}
            searchable
            searchKeys={['name', 'primary_contact_email'] as never}
            emptyMessage="No clients found."
          />
        </div>
      </div>

      {/* Add client modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add new client">
        <form onSubmit={handleSubmit(data => createTenant.mutate(data))} className="space-y-4">
          <Input label="Company name" error={errors.name?.message} {...register('name')} />
          <Input label="Primary contact name" error={errors.primary_contact_name?.message} {...register('primary_contact_name')} />
          <Input label="Email address" type="email" error={errors.primary_contact_email?.message} {...register('primary_contact_email')} />
          <Input label="Phone number" error={errors.primary_contact_phone?.message} {...register('primary_contact_phone')} />
          <Select label="Organisation type" options={typeOptions} placeholder="Select type…" error={errors.type?.message} {...register('type')} />
          <Select label="Licence tier" options={[{ value: 'per_event', label: 'Per event' }, { value: 'annual', label: 'Annual' }]} {...register('licence_tier')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create client</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm suspend/archive */}
      <ConfirmModal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && updateStatus.mutate({ id: confirmAction.tenant.id, status: confirmAction.type === 'suspend' ? 'suspended' : 'expired' })}
        title={confirmAction?.type === 'suspend' ? 'Suspend client' : 'Archive client'}
        message={`Are you sure you want to ${confirmAction?.type} ${confirmAction?.tenant.name}? This action will affect their access to the portal.`}
        confirmLabel={confirmAction?.type === 'suspend' ? 'Suspend' : 'Archive'}
        loading={updateStatus.isPending}
      />
    </div>
  )
}
