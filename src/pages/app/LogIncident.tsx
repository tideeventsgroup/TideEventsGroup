import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart, Shield, Users, Flame, AlertTriangle, Eye, Search,
  Wrench, Volume2, AlertCircle, MoreHorizontal, ArrowLeft, Camera, CheckCircle2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { generateIncidentRef } from '../../lib/utils'
import type { IncidentCategory, IncidentSeverity } from '../../types'

const CATEGORIES: { id: IncidentCategory; label: string; icon: React.ElementType; ct?: boolean }[] = [
  { id: 'medical',              label: 'Medical',            icon: Heart },
  { id: 'security',             label: 'Security',           icon: Shield },
  { id: 'crowd_pressure',       label: 'Crowd pressure',     icon: Users },
  { id: 'fire_evacuation',      label: 'Fire / evacuation',  icon: Flame },
  { id: 'ct_concern',           label: 'CT concern',         icon: AlertTriangle, ct: true },
  { id: 'suspicious_behaviour', label: 'Suspicious',         icon: Eye },
  { id: 'lost_person',          label: 'Lost person',        icon: Search },
  { id: 'infrastructure',       label: 'Infrastructure',     icon: Wrench },
  { id: 'noise_nuisance',       label: 'Noise / nuisance',   icon: Volume2 },
  { id: 'near_miss',            label: 'Near miss',          icon: AlertCircle },
  { id: 'other',                label: 'Other',              icon: MoreHorizontal },
]

const ZONES = [
  'Main stage', 'Medical post 1', 'Medical post 2',
  'Entry gate north', 'Entry gate south', 'Control room',
  'Evacuation assembly point A', 'Evacuation assembly point B',
  'Car park', 'Backstage', 'Front of stage', 'Other',
]

const SEVERITIES: {
  id: IncidentSeverity; label: string; desc: string;
  bg: string; text: string; border: string
}[] = [
  { id: 'low',      label: 'Low',      desc: 'Minor, no immediate risk',          bg: 'bg-teal',        text: 'text-white', border: '' },
  { id: 'medium',   label: 'Medium',   desc: 'Requires attention soon',           bg: 'bg-amber',       text: 'text-white', border: '' },
  { id: 'high',     label: 'High',     desc: 'Urgent — respond immediately',      bg: 'bg-danger',      text: 'text-white', border: '' },
  { id: 'critical', label: 'Critical', desc: 'Life-threatening or mass casualty', bg: 'bg-danger-dark', text: 'text-white', border: 'critical-pulse border-4 border-red-900' },
]

function StepBar({ step, total = 5 }: { step: number; total?: number }) {
  return (
    <div className="px-5 pb-4">
      <div className="flex gap-1.5 mb-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors duration-250 ${i < step ? 'bg-teal' : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">Step {step} of {total}</p>
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [refNumber, setRefNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  const eventId  = localStorage.getItem('tide_event_id')
  const tenantId = localStorage.getItem('tide_tenant_id') ?? user?.tenant_id

  function selectCategory(cat: IncidentCategory, isCt: boolean) {
    setCategory(cat)
    if (isCt) { setCtWarning(true) } else { setStep(2) }
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function submit() {
    if (!category || !severity || !eventId || !tenantId) return
    setSubmitting(true)
    const ref = generateIncidentRef()
    setRefNumber(ref)

    const payload = {
      event_id: eventId, tenant_id: tenantId, category, severity,
      description: description || null, location_zone: zone || null,
      status: 'logged' as const, logged_by: user?.id ?? null, reference_number: ref,
    }

    if (!navigator.onLine) {
      const q = JSON.parse(localStorage.getItem('tide_ims_offline_queue') ?? '[]')
      q.push({ ...payload, tempId: ref, created_at: new Date().toISOString() })
      localStorage.setItem('tide_ims_offline_queue', JSON.stringify(q))
    } else {
      await supabase.from('incidents').insert(payload)
    }

    setSubmitting(false)
    setStep(5)
  }

  /* ── CT warning ─────────────────────────────── */
  if (ctWarning) {
    return (
      <div className="min-h-dvh bg-danger flex flex-col items-center justify-center p-6 text-center" role="alert">
        <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mb-6">
          <AlertTriangle size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 leading-tight">Do not confront.<br />Do not touch.</h2>
        <p className="text-white/85 text-base leading-relaxed mb-10 max-w-xs">
          Remove yourself from the area if safe to do so, then complete this report.
        </p>
        <button
          onClick={() => { setCtWarning(false); setStep(2) }}
          className="bg-white text-danger font-bold px-8 py-4 rounded-xl text-base w-full max-w-xs active:opacity-90"
          style={{ minHeight: 56 }}
        >
          I understand — continue to report
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <button
          onClick={() => step === 1 ? navigate('/app') : setStep(s => s - 1)}
          className="tap-target -ml-2 text-navy"
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-base font-semibold text-navy">Log incident</h1>
      </div>

      <StepBar step={step} />

      <div className="flex-1 px-5 pb-8">

        {/* Step 1 — Category */}
        {step === 1 && (
          <div>
            <p className="text-sm font-medium text-navy mb-4">What type of incident is this?</p>
            <div className="grid grid-cols-3 gap-2.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.id, !!cat.ct)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                    category === cat.id
                      ? 'border-teal bg-teal-50'
                      : 'border-border bg-white hover:border-teal/40'
                  }`}
                  style={{ minHeight: 84 }}
                >
                  <cat.icon
                    size={24}
                    className={cat.ct ? 'text-danger' : category === cat.id ? 'text-teal' : 'text-navy'}
                  />
                  <span className={`text-xs text-center leading-tight font-medium ${
                    cat.ct ? 'text-danger' : 'text-navy'
                  }`}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Location */}
        {step === 2 && (
          <div>
            <p className="text-sm font-medium text-navy mb-4">Where did this happen?</p>
            <div
              className="bg-gray-100 border border-border rounded-xl flex flex-col items-center justify-center text-center mb-4 cursor-pointer"
              style={{ height: 160 }}
            >
              <Map size={28} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Map not available offline</p>
              <p className="text-xs text-gray-300 mt-1">Select zone below</p>
            </div>

            <label className="label">Select zone <span className="text-danger">*</span></label>
            <select
              className="input mb-6"
              value={zone}
              onChange={e => setZone(e.target.value)}
              required
            >
              <option value="">Choose a zone…</option>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>

            <button
              onClick={() => setStep(3)}
              disabled={!zone}
              className="w-full btn-primary btn-lg disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3 — Severity */}
        {step === 3 && (
          <div>
            <p className="text-sm font-medium text-navy mb-4">How severe is this incident?</p>
            <div className="space-y-3">
              {SEVERITIES.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSeverity(s.id); setStep(4) }}
                  className={`w-full ${s.bg} ${s.text} ${s.border} rounded-xl flex items-center gap-4 px-5 active:opacity-90 transition-opacity`}
                  style={{ minHeight: 68 }}
                >
                  <div className="text-left flex-1">
                    <div className="font-bold text-lg">{s.label}</div>
                    <div className="text-white/75 text-xs mt-0.5">{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4 — Description */}
        {step === 4 && (
          <div>
            <p className="text-sm font-medium text-navy mb-4">Describe what happened</p>

            <textarea
              className="input resize-none mb-1"
              rows={5}
              placeholder="Provide as much detail as possible — what you saw, heard, or were told…"
              maxLength={500}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <p className="text-xs text-right text-gray-400 mb-5 tabular-nums">{description.length} / 500</p>

            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              aria-label="Capture photo"
              onChange={handlePhoto}
            />

            {photoPreview ? (
              <div className="mb-5">
                <img src={photoPreview} alt="Captured incident photo" className="w-full rounded-xl object-cover max-h-52 mb-2" />
                <button
                  onClick={() => setPhotoPreview(null)}
                  className="text-xs text-danger"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <button
                onClick={() => photoRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 mb-5 active:bg-gray-50"
              >
                <Camera size={18} />
                Add photo (optional)
              </button>
            )}

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full btn-primary btn-lg"
            >
              {submitting ? 'Submitting…' : 'Submit incident report'}
            </button>
          </div>
        )}

        {/* Step 5 — Confirmation */}
        {step === 5 && (
          <div className="flex flex-col items-center text-center pt-4">
            <div className="h-20 w-20 rounded-full bg-teal-50 flex items-center justify-center mb-5">
              <CheckCircle2 size={40} className="text-teal" />
            </div>
            <h2 className="text-xl font-bold text-navy mb-1">Incident logged</h2>
            <p className="text-sm text-gray-500 mb-5">Your report has been submitted successfully</p>

            <div className="bg-navy-50 border border-navy/10 rounded-xl px-6 py-4 mb-6 w-full">
              <p className="text-xs text-gray-400 mb-1">Reference number</p>
              <p className="font-mono font-bold text-navy text-lg tracking-wider">{refNumber}</p>
            </div>

            <dl className="w-full space-y-2 text-sm mb-8">
              {[
                ['Category', category?.replace(/_/g, ' ')],
                ['Severity', severity],
                ['Location', zone],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-border">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium text-navy capitalize">{v}</dd>
                </div>
              ))}
            </dl>

            {!navigator.onLine && (
              <p className="text-xs text-amber-600 font-medium mb-4 flex items-center gap-2">
                <AlertTriangle size={14} />
                Saved offline — will sync when you reconnect
              </p>
            )}

            <button onClick={() => navigate('/app')} className="w-full btn-primary btn-lg">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Needed for step 2 map placeholder
function Map({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  )
}
