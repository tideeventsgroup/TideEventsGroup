import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { formatDate } from '../../lib/utils'
import type { User } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
})
type FormData = z.infer<typeof schema>

export function StaffManagement() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  const { data: staff = [] } = useQuery({
    queryKey: ['staff', user?.tenant_id],
    enabled: !!user?.tenant_id,
    queryFn: async () => {
      return api.get<User[]>(`/users?tenant_id=${user!.tenant_id!}&role=client_staff`)
    }
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const invite = useMutation({
    mutationFn: async (data: FormData) => {
      await api.post('/users', {
        email: data.email,
        name: data.name,
        role: 'client_staff',
        tenant_id: user!.tenant_id!,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      reset()
      setInviteOpen(false)
      setInviteSuccess(true)
      setTimeout(() => setInviteSuccess(false), 4000)
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Staff management</h1>
          <p className="text-sm text-gray-500 mt-1">{staff.length} staff member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Plus size={16} />
          Invite staff member
        </Button>
      </div>

      {inviteSuccess && (
        <div className="mb-4 px-4 py-3 bg-teal/10 border border-teal/20 rounded text-sm text-teal-dark flex items-center gap-2">
          <Mail size={16} />
          Invitation sent successfully.
        </div>
      )}

      <div className="mb-4 p-4 bg-amber/5 border border-amber/20 rounded text-sm text-amber-800">
        Staff members can only access the mobile app (<strong>/app</strong>). They cannot log in to this portal.
      </div>

      <Table
        data={staff as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'name', header: 'Name', sortable: true },
          { key: 'email', header: 'Email', sortable: true },
          { key: 'role', header: 'Role', render: () => <Badge variant="gray">Staff</Badge> },
          { key: 'created_at', header: 'Joined', render: (row) => formatDate(row.created_at as string) },
        ]}
        searchable
        searchKeys={['name', 'email'] as never}
        emptyMessage="No staff members yet. Invite your first staff member."
      />

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite staff member">
        <form onSubmit={handleSubmit(data => invite.mutate(data))} className="space-y-4">
          <Input label="Full name" error={errors.name?.message} {...register('name')} />
          <Input label="Email address" type="email" error={errors.email?.message} {...register('email')} />
          <p className="text-xs text-gray-500">The staff member will receive an email invitation to set their password and access the mobile app.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Send invitation</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
