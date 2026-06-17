import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, CheckCircle, User, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { StatusBadge } from '../../components/ui/Badge'
import { formatDate, daysUntil } from '../../lib/utils'
import type { Event, MartynCompliance } from '../../types'

const COMPLIANCE_ITEMS = [
  'counter_terrorism_procedures', 'evacuation_procedures', 'invacuation_procedures',
  'shelter_in_place_procedures', 'lockdown_procedures', 'training_staff',
  'communicating_staff', 'communicating_public', 'working_with_others'
]

function ComplianceRing({ percent }: { percent: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const dash = (percent / 100) * circ
  return (
    <div className="flex flex-col items-center">
      <svg width="110" height="110" className="-rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="55" cy="55" r={r} fill="none"
          stroke="#1D9E75" strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="-mt-16 text-center">
        <div className="text-2xl font-semibold text-navy">{Math.round(percent)}%</div>
        <div className="text-xs text-gray-500">complete</div>
      </div>
      <div className="mt-10 text-sm text-gray-600 font-medium">Martyn's Law compliance</div>
    </div>
  )
}

export function ClientDashboard() {
  const { user } = useAuth()

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['client-events', user?.tenant_id],
    enabled: !!user?.tenant_id,
    queryFn: async () => {
      const { data } = await supabase.from('events').select('*').eq('tenant_id', user!.tenant_id!).order('start_date')
      return (data ?? []) as Event[]
    }
  })

  const { data: compliance = [] } = useQuery({
    queryKey: ['compliance', user?.tenant_id],
    enabled: !!user?.tenant_id,
    queryFn: async () => {
      const { data } = await supabase.from('martyn_compliance').select('*').eq('tenant_id', user!.tenant_id!)
      return (data ?? []) as MartynCompliance[]
    }
  })

  const completedItems = compliance.filter(c => c.status === 'complete').length
  const compliancePercent = COMPLIANCE_ITEMS.length > 0 ? (completedItems / COMPLIANCE_ITEMS.length) * 100 : 0

  const upcomingEvents = events.filter(e => e.start_date && new Date(e.start_date) >= new Date())

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-navy">Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
        <p className="text-sm text-gray-500 mt-1">Here's an overview of your account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Compliance ring */}
        <div className="card flex items-center justify-center py-8">
          <ComplianceRing percent={compliancePercent} />
        </div>

        {/* Upcoming events */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-navy mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-teal" />
            Upcoming events
          </h2>
          {eventsLoading ? <LoadingSpinner className="h-24" /> : (
            upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-navy">{event.name}</p>
                      <p className="text-xs text-gray-500">{event.venue_name} · {formatDate(event.start_date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {event.start_date && (
                        <span className="text-xs text-gray-400">{daysUntil(event.start_date)} days</span>
                      )}
                      <StatusBadge status={event.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No upcoming events. <a href="/client/events" className="text-teal hover:underline">Create your first event.</a></p>
            )
          )}
        </div>
      </div>

      {/* Outstanding actions placeholder */}
      <div className="card">
        <h2 className="text-base font-semibold text-navy mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-amber" />
          Outstanding actions
        </h2>
        <div className="space-y-2">
          {compliancePercent < 100 && (
            <div className="flex items-center gap-3 p-3 bg-amber/5 border border-amber/20 rounded">
              <CheckCircle size={16} className="text-amber flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-navy">Complete Martyn's Law compliance checklist</p>
                <p className="text-xs text-gray-500">{completedItems} of {COMPLIANCE_ITEMS.length} items complete</p>
              </div>
            </div>
          )}
          {events.filter(e => e.status === 'planning').map(e => (
            <div key={e.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
              <Calendar size={16} className="text-gray-400 flex-shrink-0" />
              <p className="text-sm text-navy">Complete documentation for <span className="font-medium">{e.name}</span></p>
            </div>
          ))}
          {events.length === 0 && compliancePercent === 100 && (
            <p className="text-sm text-gray-400">No outstanding actions.</p>
          )}
        </div>
      </div>
    </div>
  )
}
