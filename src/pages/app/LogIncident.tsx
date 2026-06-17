import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart, Shield, Users, Flame, AlertTriangle, Eye, Search,
  Wrench, Volume2, AlertCircle, MoreHorizontal, ArrowLeft, Camera, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { generateIncidentRef } from '../../lib/utils'
import type { IncidentCategory, IncidentSeverity } from '../../types'

const CATEGORIES: { id: IncidentCategory; label: string; icon: React.ElementType; ct?: boolean }[] = [
  { id: 'medical', label: 'Medical', icon: Heart },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'crowd_pressure', label: 'Crowd pressure', icon: Users },
  { id: 'fire_evacuation', label: 'Fire / evacuation', icon: Flame },
  { id: 'ct_concern', label: 'CT concern', icon: AlertTriangle, ct: true },
  { id: 'suspicious_behaviour', label: 'Suspicious behaviour', icon: Eye },
  { id: 'lost_person', label: 'Lost person', icon: Search },
  { id: 'infrastructure', label: 'Infrastructure', icon: Wrench },
  { id: 'noise_nuisance', label: 'Noise / nuisance', icon: Volume2 },
  { id: 'near_miss', label: 'Near miss', icon: AlertCircle },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
]

const ZONES = ['Main stage', 'Medical post 1', 'Medical post 2', 'Entry gate north', 'Entry gate south', 'Control room', 'Evacuation assembly point A', 'Evacuation assembly point B', 'Car park', 'Backstage', 'Other']

const SEVERITIES: { id: IncidentSeverity; label: string; bg: string; text: string; border?: string }[] = [
  { id: 'low', label: 'Low', bg: 'bg-teal', text: 'text-white' },
  { id: 'medium', label: 'Medium', bg: 'bg-amber', text: 'text-white' },
  { id: 'high', label: 'High', bg: 'bg-danger', text: 'text-white' },
  { id: 'critical', label: 'Critical', bg: 'bg-danger-dark', text: 'text-white', border: 'critical-pulse border-4 border-red-900' },
]

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[1, 2, 3, 4, 5].map(s => (
        <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-teal' : 'bg-gray-200'}`} />
      ))}
      <span className="ml-2 text-xs text-gray-400 whitespace-nowrap">Step {step} of 5</span>
    </div>
  )
}

export function LogIncident() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [ctWarning, setCtWarning] = useState(false)
  const [category, setCategory] = useState<IncidentCategory | null>(null)
  const [zone, setZone] = useState('')
  const [severity, setSeverity] = useState<IncidentSeverity | null>(null)
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [refNumber, setRefNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  const eventId = localStorage.getItem('tide_event_id')
  const tenantId = localStorage.getItem('tide_tenant_id') ?? user?.tenant_id

  function selectCategory(cat: IncidentCategory, isCt: boolean) {
    setCategory(cat)
    if (isCt) {
      setCtWarning(true)
    } else {
      setStep(2)
    }
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
  }

  async function submit() {
    if (!category || !severity || !eventId || !tenantId) return
    setSubmitting(true)

    const ref = generateIncidentRef()
    setRefNumber(ref)

    const incident = {
      event_id: eventId,
      tenant_id: tenantId,
      category,
      severity,
      description: description || null,
      location_zone: zone || null,
      status: 'logged' as const,
      logged_by: user?.id ?? null,
      reference_number: ref,
    }

    if (!navigator.onLine) {
      // Queue for later sync
      const queue = JSON.parse(localStorage.getItem('tide_ims_offline_queue') ?? '[]')
      queue.push({ ...incident, tempId: ref, created_at: new Date().toISOString() })
      localStorage.setItem('tide_ims_offline_queue', JSON.stringify(queue))
    } else {
      const { error } = await supabase.from('incidents').insert(incident)
      if (error) console.error(error)
    }

    setSubmitting(false)
    setStep(5)
  }

  // CT warning interstitial
  if (ctWarning) {
    return (
      <div className="min-h-screen bg-danger flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={48} className="text-white mb-4" />
        <h2 className="text-2xl font-bold text-white mb-3">Do not confront. Do not touch.</h2>
        <p className="text-white/90 text-base mb-8 leading-relaxed">
          Remove yourself from the area if safe to do so.<br />
          Then complete this report.
        </p>
        <button
          onClick={() => { setCtWarning(false); setStep(2) }}
          className="bg-white text-danger font-semibold px-8 py-4 rounded-xl text-base w-full max-w-xs"
        >
          Continue to report
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => step === 1 ? navigate('/app') : setStep(s => s - 1)} className="p-2 -ml-2">
          <ArrowLeft size={20} className="text-navy" />
        </button>
        <h1 className="text-base font-semibold text-navy">Log incident</h1>
      </div>

      <StepBar step={step} />

      <div className="px-4">
        {/* Step 1 — Category */}
        {step === 1 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Select the incident category</p>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.id, !!cat.ct)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                    category === cat.id ? 'border-teal bg-teal/5' : 'border-gray-200 bg-white hover:border-teal/50'
                  }`}
                  style={{ minHeight: '88px' }}
                >
                  <cat.icon size={24} className={cat.ct ? 'text-danger' : 'text-navy'} />
                  <span className="text-xs text-center leading-tight text-navy font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Location */}
        {step === 2 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Where did this happen?</p>
            <div className="bg-gray-200 rounded-xl h-40 flex items-center justify-center mb-4 text-gray-400 text-sm">
              Map view — tap to pin location
            </div>
            <label className="label">Select zone</label>
            <select className="input mb-4" value={zone} onChange={e => setZone(e.target.value)}>
              <option value="">Select a zone…</option>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <button
              onClick={() => setStep(3)}
              disabled={!zone}
              className="w-full btn-primary py-4 text-base disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3 — Severity */}
        {step === 3 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">How severe is this incident?</p>
            <div className="space-y-3">
              {SEVERITIES.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSeverity(s.id); setStep(4) }}
                  className={`w-full ${s.bg} ${s.text} ${s.border ?? ''} py-5 rounded-xl text-lg font-semibold transition-opacity active:opacity-80`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4 — Description */}
        {step === 4 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Describe what happened</p>
            <textarea
              className="input resize-none mb-1"
              rows={5}
              placeholder="Describe the incident…"
              maxLength={500}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <p className="text-xs text-right text-gray-400 mb-4">{description.length}/500</p>

            <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            {photoPreview ? (
              <div className="mb-4">
                <img src={photoPreview} alt="Captured" className="w-full rounded-xl object-cover max-h-48" />
                <button onClick={() => { setPhoto(null); setPhotoPreview(null) }} className="text-xs text-danger mt-2">Remove photo</button>
              </div>
            ) : (
              <button onClick={() => photoRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 mb-4">
                <Camera size={18} />
                Add photo (optional)
              </button>
            )}

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full btn-primary py-4 text-base"
            >
              {submitting ? 'Submitting…' : 'Submit incident'}
            </button>
          </div>
        )}

        {/* Step 5 — Confirmation */}
        {step === 5 && (
          <div className="text-center py-8">
            <div className="h-20 w-20 rounded-full bg-teal/15 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={36} className="text-teal" />
            </div>
            <h2 className="text-xl font-semibold text-navy mb-2">Incident logged</h2>
            <p className="text-sm text-gray-500 mb-2">Reference number</p>
            <p className="text-lg font-mono font-semibold text-navy bg-gray-100 rounded-lg py-2 px-4 inline-block mb-6">
              {refNumber}
            </p>
            <div className="text-sm text-gray-500 space-y-1 mb-8">
              <p>Category: <span className="font-medium text-navy">{category?.replace(/_/g, ' ')}</span></p>
              <p>Severity: <span className="font-medium text-navy capitalize">{severity}</span></p>
              <p>Location: <span className="font-medium text-navy">{zone}</span></p>
              {!navigator.onLine && <p className="text-amber font-medium mt-2">Saved offline — will sync when reconnected</p>}
            </div>
            <button
              onClick={() => navigate('/app')}
              className="w-full btn-primary py-4 text-base"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
