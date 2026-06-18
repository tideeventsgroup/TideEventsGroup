import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Calendar, Radio } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/Badge'
import { formatDate, daysUntil } from '../../lib/utils'
import type { Event } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  venue_name: z.string().min(1, 'Required'),
  venue_address: z.string().min(1, 'Required'),
  start_date: z.string().min(1, 'Required'),
  end_date: z.string().min(1, 'Required'),
  expected_attendance: z.coerce.number().min(1, 'Required'),
})
type FormData = z.infer<typeof schema>

const eventTypeOptions = [
  { value: 'outdoor_festival', label: 'Outdoor festival' },
  { value: 'harbour_event', label: 'Harbour event' },
  { value: 'street_event', label: 'Street event' },
  { value: 'indoor_venue', label: 'Indoor venue' },
  { value: 'sporting_event', label: 'Sporting event' },
  { value: 'community_event', label: 'Community event' },
]

export function Events() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)

  function goLive(event: Event) {
    localStorage.setItem('tide_event_id', event.id)
    localStorage.setItem('tide_event_name', event.name)
    navigate('/client/live')
  }

  const { data: events = [] } = useQuery({
    queryKey: ['events', user?.tenant_id],
    enabled: !!user?.tenant_id,
    queryFn: async () => {
      return api.get<Event[]>(`/events?tenant_id=${user!.tenant_id!}`)
    }
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const create = useMutation({
    mutationFn: async (data: FormData) => {
      await api.post('/events', {
        ...data,
        tenant_id: user!.tenant_id!,
        status: 'planning',
      })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); reset(); setAddOpen(false) }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Events</h1>
          <p className="text-sm text-gray-500 mt-1">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          New event
        </Button>
      </div>

      <Table
        data={events as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'name', header: 'Event name', sortable: true },
          { key: 'type', header: 'Type', render: (row) => (row.type as string)?.replace(/_/g, ' ') ?? '—' },
          { key: 'venue_name', header: 'Venue' },
          { key: 'start_date', header: 'Date', sortable: true, render: (row) => formatDate(row.start_date as string) },
          {
            key: 'days', header: 'Days away',
            render: (row) => {
              if (!row.start_date) return '—'
              const d = daysUntil(row.start_date as string)
              return d < 0 ? 'Passed' : d === 0 ? 'Today' : `${d} days`
            }
          },
          {
            key: 'status', header: 'Status',
            render: (row) => (
              <div className="flex items-center gap-2">
                <StatusBadge status={row.status as string} />
                {row.status === 'live' && (
                  <button
                    onClick={() => goLive(row as unknown as Event)}
                    className="btn btn-sm bg-red-600 text-white hover:bg-red-700 gap-1"
                  >
                    <Radio size={12} />
                    Live Dashboard →
                  </button>
                )}
              </div>
            )
          },
        ]}
        searchable
        searchKeys={['name', 'venue_name'] as never}
        emptyMessage="No events yet."
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Create new event">
        <form onSubmit={handleSubmit(d => create.mutate(d))} className="space-y-4">
          <Input label="Event name" error={errors.name?.message} {...register('name')} />
          <Select label="Event type" options={eventTypeOptions} placeholder="Select type…" error={errors.type?.message} {...register('type')} />
          <Input label="Venue name" error={errors.venue_name?.message} {...register('venue_name')} />
          <Input label="Venue address" error={errors.venue_address?.message} {...register('venue_address')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start date" type="date" error={errors.start_date?.message} {...register('start_date')} />
            <Input label="End date" type="date" error={errors.end_date?.message} {...register('end_date')} />
          </div>
          <Input label="Expected attendance" type="number" error={errors.expected_attendance?.message} {...register('expected_attendance')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create event</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
