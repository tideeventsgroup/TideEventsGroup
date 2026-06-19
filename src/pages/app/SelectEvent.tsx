import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { formatDate } from '../../lib/utils'
import type { Event } from '../../types'

export function SelectEvent() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['app-events', user?.tenant_id],
    enabled: !!user?.tenant_id,
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('tenant_id', user!.tenant_id!)
      params.append('status', 'live')
      params.append('status', 'planning')
      params.append('status', 'documentation')
      params.append('status', 'pre_event_review')
      return api.get<Event[]>(`/events?${params}`)
    }
  })

  useEffect(() => {
    if (!isLoading && events.length === 1) {
      selectEvent(events[0])
    }
  }, [events, isLoading])

  function selectEvent(event: Event) {
    localStorage.setItem('tide_event_id', event.id)
    localStorage.setItem('tide_event_name', event.name)
    localStorage.setItem('tide_tenant_id', event.tenant_id)
    navigate('/app')
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="min-h-screen bg-surface p-4">
      <div className="mb-6 pt-4">
        <h1 className="text-xl font-semibold text-navy">Select event</h1>
        <p className="text-sm text-gray-500 mt-1">Choose the event you are working today</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No active events assigned to you.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <button
              key={event.id}
              onClick={() => selectEvent(event)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl p-5 active:bg-gray-50 transition-colors"
            >
              <p className="font-semibold text-navy mb-1">{event.name}</p>
              <p className="text-sm text-gray-500">{event.venue_name}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(event.start_date)} → {formatDate(event.end_date)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}
