import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Calendar, MapPin, Users, Clock } from 'lucide-react'
import { api } from '../../lib/api'
import type { TideEvent } from '../../types'
export function PlanningEventDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: event } = useQuery({ queryKey: ['event', id], queryFn: () => api.get<TideEvent>(`/events/${id}`) })
  if (!event) return <div className="p-8 text-gray-400">Loading…</div>
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/planning/events" className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Events
      </Link>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{event.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-3">
          {event.venue_name && <span className="flex items-center gap-1.5"><MapPin size={14} />{event.venue_name}</span>}
          {event.expected_attendance && <span className="flex items-center gap-1.5"><Users size={14} />{event.expected_attendance.toLocaleString()} expected</span>}
          {event.start_date && <span className="flex items-center gap-1.5"><Calendar size={14} />{new Date(event.start_date).toLocaleDateString('en-GB')}</span>}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Status', value: event.status.replace(/_/g,' ') },
            { label: 'Risk Level', value: event.risk_level },
            { label: 'Type', value: event.type?.replace(/_/g,' ') ?? '—' },
            { label: 'Capacity', value: event.capacity?.toLocaleString() ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
              <p className="font-semibold text-gray-900 mt-1 capitalize">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
