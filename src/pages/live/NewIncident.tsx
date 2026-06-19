import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { AlertTriangle, MapPin, X, Radio } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { TideEvent, IncidentPriority, IncidentCategory } from '../../types'
import { PRIORITY_LABELS, INCIDENT_TYPES_BY_CATEGORY } from '../../types'

const PRIORITIES: IncidentPriority[] = ['P1','P2','P3','P4','P5']
const CATEGORIES: IncidentCategory[] = ['security','medical','safety','welfare','infrastructure','environmental','other']

const PRIORITY_DESCS: Record<IncidentPriority, string> = {
  P1: 'Life-threatening / Immediate danger',
  P2: 'Serious / Urgent response required',
  P3: 'Standard incident / Prompt response',
  P4: 'Minor / Routine response',
  P5: 'Information only / No response needed',
}

const ZONES = [
  'Main Stage','North Gate','South Gate','East Gate','West Gate',
  'Medical Hub','Security Post 1','Security Post 2','Welfare Point',
  'Car Park A','Car Park B','VIP Area','Backstage','Front of Stage',
  'Hospitality','Concourse','Arena Floor','Other',
]

export function NewIncident() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: events = [] } = useQuery({
    queryKey: ['live-events'],
    queryFn: () => api.get<TideEvent[]>('/events?status=live'),
  })
  const liveEvent = events[0] ?? null

  const [priority, setPriority] = useState<IncidentPriority>('P3')
  const [category, setCategory] = useState<IncidentCategory>('security')
  const [incidentType, setIncidentType] = useState('')
  const [description, setDescription] = useState('')
  const [locationZone, setLocationZone] = useState('')
  const [customZone, setCustomZone] = useState('')

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Record<string, unknown>>('/incidents', data),
    onSuccess: (incident: Record<string, unknown>) => {
      qc.invalidateQueries({ queryKey: ['incidents'] })
      qc.invalidateQueries({ queryKey: ['live-incidents'] })
      navigate(`/live/incidents/${incident.id}`)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!liveEvent || !user) return
    mutation.mutate({
      event_id: liveEvent.id,
      tenant_id: liveEvent.tenant_id,
      priority,
      category,
      incident_type: incidentType || null,
      description,
      location_zone: locationZone === 'Other' ? customZone : locationZone,
    })
  }

  const pc = { P1:'#FF3B30', P2:'#FF9500', P3:'#FFCC00', P4:'#34C759', P5:'#636366' }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0A0B0F' }}>
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h1 className="text-white font-bold text-lg">New Incident</h1>
          <p className="text-white/30 text-xs">Create a new CAD incident · {liveEvent?.name ?? 'No live event'}</p>
        </div>
        <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white/70 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-5">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Priority Level *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className="flex flex-col items-center p-3 rounded-xl text-center transition-all"
                  style={{
                    background: priority === p ? `${pc[p]}20` : 'rgba(255,255,255,0.04)',
                    border: priority === p ? `2px solid ${pc[p]}` : '2px solid transparent',
                  }}>
                  <span className="font-black text-lg" style={{ color: pc[p] }}>{p}</span>
                  <span className="text-white/40 text-xs mt-1 leading-tight">{PRIORITY_DESCS[p].split('/')[0].trim()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Category *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCategory(c); setIncidentType('') }}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all text-center"
                  style={{
                    background: category === c ? 'rgba(232,82,26,0.15)' : 'rgba(255,255,255,0.04)',
                    border: category === c ? '1px solid rgba(232,82,26,0.4)' : '1px solid transparent',
                    color: category === c ? '#E8521A' : 'rgba(255,255,255,0.5)',
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Incident Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Incident Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INCIDENT_TYPES_BY_CATEGORY[category]?.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setIncidentType(value)}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all"
                  style={{
                    background: incidentType === value ? 'rgba(91,140,255,0.12)' : 'rgba(255,255,255,0.04)',
                    border: incidentType === value ? '1px solid rgba(91,140,255,0.35)' : '1px solid transparent',
                    color: incidentType === value ? '#5B8CFF' : 'rgba(255,255,255,0.5)',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <MapPin size={12} className="inline mr-1" />Location / Zone *
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {ZONES.map(z => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setLocationZone(z)}
                  className="px-2 py-2 rounded-xl text-xs font-medium transition-all text-center"
                  style={{
                    background: locationZone === z ? 'rgba(78,205,196,0.12)' : 'rgba(255,255,255,0.04)',
                    border: locationZone === z ? '1px solid rgba(78,205,196,0.35)' : '1px solid transparent',
                    color: locationZone === z ? '#4ECDC4' : 'rgba(255,255,255,0.4)',
                  }}>
                  {z}
                </button>
              ))}
            </div>
            {locationZone === 'Other' && (
              <input
                value={customZone}
                onChange={e => setCustomZone(e.target.value)}
                placeholder="Specify location…"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none mt-2"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Description *
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the incident in detail…"
              rows={4}
              required
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!liveEvent || !locationZone || !description || mutation.isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ background: priority === 'P1' ? '#FF3B30' : '#E8521A' }}>
              <Radio size={16} />
              {mutation.isPending ? 'Creating…' : `Dispatch Incident · ${priority}`}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl font-semibold text-white/50 hover:text-white/80 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              Cancel
            </button>
          </div>

          {mutation.isError && (
            <p className="text-sm font-medium" style={{ color: '#FF3B30' }}>
              Failed to create incident. Please try again.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
