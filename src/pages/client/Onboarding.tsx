import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Check, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'

const step1Schema = z.object({
  company_name: z.string().min(1, 'Required'),
  registered_address: z.string().min(1, 'Required'),
  primary_contact_name: z.string().min(1, 'Required'),
  primary_contact_email: z.string().email('Valid email required'),
  primary_contact_phone: z.string().min(1, 'Required'),
  organisation_type: z.string().min(1, 'Required'),
})

const step2Schema = z.object({
  event_name: z.string().min(1, 'Required'),
  event_type: z.string().min(1, 'Required'),
  expected_attendance: z.coerce.number().min(1, 'Required'),
  venue_name: z.string().min(1, 'Required'),
  venue_address: z.string().min(1, 'Required'),
  start_date: z.string().min(1, 'Required'),
  end_date: z.string().min(1, 'Required'),
  licensed: z.boolean(),
  sag_involvement: z.boolean(),
  police_liaison_name: z.string().optional(),
  police_liaison_contact: z.string().optional(),
})

const step3Schema = z.object({
  contractors: z.array(z.object({
    company_name: z.string().min(1, 'Required'),
    type: z.string().min(1, 'Required'),
    sia_licence_number: z.string().optional(),
    primary_contact_name: z.string().optional(),
    primary_contact_phone: z.string().optional(),
  }))
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>

const orgTypeOptions = [
  { value: 'festival', label: 'Festival' },
  { value: 'venue', label: 'Venue' },
  { value: 'local_authority', label: 'Local authority' },
  { value: 'charity', label: 'Charity' },
  { value: 'private_event_company', label: 'Private event company' },
]
const eventTypeOptions = [
  { value: 'outdoor_festival', label: 'Outdoor festival' },
  { value: 'harbour_event', label: 'Harbour event' },
  { value: 'street_event', label: 'Street event' },
  { value: 'indoor_venue', label: 'Indoor venue' },
  { value: 'sporting_event', label: 'Sporting event' },
  { value: 'community_event', label: 'Community event' },
]
const contractorTypeOptions = [
  { value: 'security', label: 'Security' },
  { value: 'stewarding', label: 'Stewarding' },
  { value: 'medical', label: 'Medical' },
  { value: 'fire_safety', label: 'Fire safety' },
  { value: 'infrastructure', label: 'Infrastructure' },
]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            i + 1 < current ? 'bg-teal text-white' :
            i + 1 === current ? 'bg-navy text-white' :
            'bg-gray-200 text-gray-400'
          }`}>
            {i + 1 < current ? <Check size={14} /> : i + 1}
          </div>
          {i < total - 1 && <div className={`flex-1 h-0.5 ${i + 1 < current ? 'bg-teal' : 'bg-gray-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  )
}

export function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null)
  const [step3Data, setStep3Data] = useState<Step3Data | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: { licensed: false, sag_involvement: false } })
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema), defaultValues: { contractors: [{ company_name: '', type: '', sia_licence_number: '', primary_contact_name: '', primary_contact_phone: '' }] } })
  const { fields, append, remove } = useFieldArray({ control: form3.control, name: 'contractors' })

  async function onSubmit() {
    if (!step1Data || !step2Data || !user?.tenant_id) return
    setSubmitting(true)
    try {
      await supabase.from('tenants').update({
        name: step1Data.company_name,
        registered_address: step1Data.registered_address,
        primary_contact_name: step1Data.primary_contact_name,
        primary_contact_email: step1Data.primary_contact_email,
        primary_contact_phone: step1Data.primary_contact_phone,
        type: step1Data.organisation_type,
        status: 'active',
      }).eq('id', user.tenant_id)

      const { data: event } = await supabase.from('events').insert({
        tenant_id: user.tenant_id,
        name: step2Data.event_name,
        type: step2Data.event_type,
        expected_attendance: step2Data.expected_attendance,
        venue_name: step2Data.venue_name,
        venue_address: step2Data.venue_address,
        start_date: step2Data.start_date,
        end_date: step2Data.end_date,
        licensed: step2Data.licensed,
        sag_involvement: step2Data.sag_involvement,
        police_liaison_name: step2Data.police_liaison_name ?? null,
        police_liaison_contact: step2Data.police_liaison_contact ?? null,
        status: 'planning',
      }).select().single()

      if (step3Data?.contractors && event) {
        await supabase.from('contractors').insert(
          step3Data.contractors.filter(c => c.company_name).map(c => ({
            tenant_id: user.tenant_id!,
            event_id: event.id,
            company_name: c.company_name,
            type: c.type,
            sia_licence_number: c.sia_licence_number || null,
            primary_contact_name: c.primary_contact_name || null,
            primary_contact_phone: c.primary_contact_phone || null,
          }))
        )
      }

      navigate('/client')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-navy">Onboarding</h1>
        <p className="text-sm text-gray-500 mt-1">Set up your organisation and first event</p>
      </div>

      <StepIndicator current={step} total={5} />

      {step === 1 && (
        <div className="card">
          <h2 className="text-base font-semibold text-navy mb-4">Step 1 — Organisation profile</h2>
          <form onSubmit={form1.handleSubmit(d => { setStep1Data(d); setStep(2) })} className="space-y-4">
            <Input label="Company name" error={form1.formState.errors.company_name?.message} {...form1.register('company_name')} />
            <Textarea label="Registered address" rows={3} error={form1.formState.errors.registered_address?.message} {...form1.register('registered_address')} />
            <Input label="Primary contact name" error={form1.formState.errors.primary_contact_name?.message} {...form1.register('primary_contact_name')} />
            <Input label="Email address" type="email" error={form1.formState.errors.primary_contact_email?.message} {...form1.register('primary_contact_email')} />
            <Input label="Phone number" error={form1.formState.errors.primary_contact_phone?.message} {...form1.register('primary_contact_phone')} />
            <Select label="Organisation type" options={orgTypeOptions} placeholder="Select type…" error={form1.formState.errors.organisation_type?.message} {...form1.register('organisation_type')} />
            <div className="flex justify-end pt-2">
              <Button type="submit">Continue</Button>
            </div>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h2 className="text-base font-semibold text-navy mb-4">Step 2 — Event profile</h2>
          <form onSubmit={form2.handleSubmit(d => { setStep2Data(d); setStep(3) })} className="space-y-4">
            <Input label="Event name" error={form2.formState.errors.event_name?.message} {...form2.register('event_name')} />
            <Select label="Event type" options={eventTypeOptions} placeholder="Select type…" error={form2.formState.errors.event_type?.message} {...form2.register('event_type')} />
            <Input label="Expected attendance" type="number" error={form2.formState.errors.expected_attendance?.message} {...form2.register('expected_attendance')} />
            <Input label="Venue name" error={form2.formState.errors.venue_name?.message} {...form2.register('venue_name')} />
            <Textarea label="Venue address" rows={2} error={form2.formState.errors.venue_address?.message} {...form2.register('venue_address')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start date" type="date" error={form2.formState.errors.start_date?.message} {...form2.register('start_date')} />
              <Input label="End date" type="date" error={form2.formState.errors.end_date?.message} {...form2.register('end_date')} />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-teal" {...form2.register('licensed')} />
                <span>Licensed event</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-teal" {...form2.register('sag_involvement')} />
                <span>SAG involvement</span>
              </label>
            </div>
            <Input label="Police liaison name (optional)" {...form2.register('police_liaison_name')} />
            <Input label="Police liaison contact (optional)" {...form2.register('police_liaison_contact')} />
            <div className="flex justify-between pt-2">
              <Button variant="outline" type="button" onClick={() => setStep(1)}>Back</Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h2 className="text-base font-semibold text-navy mb-4">Step 3 — Contractor stack</h2>
          <form onSubmit={form3.handleSubmit(d => { setStep3Data(d); setStep(4) })} className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border border-gray-200 rounded-lg relative">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-navy">Contractor {index + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="text-danger hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <Input label="Company name" {...form3.register(`contractors.${index}.company_name`)} />
                  <Select label="Type" options={contractorTypeOptions} placeholder="Select type…" {...form3.register(`contractors.${index}.type`)} />
                  <Input label="SIA licence number (if applicable)" {...form3.register(`contractors.${index}.sia_licence_number`)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Contact name" {...form3.register(`contractors.${index}.primary_contact_name`)} />
                    <Input label="Contact phone" {...form3.register(`contractors.${index}.primary_contact_phone`)} />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ company_name: '', type: '', sia_licence_number: '', primary_contact_name: '', primary_contact_phone: '' })}
              className="flex items-center gap-2 text-sm text-teal hover:text-teal-dark font-medium"
            >
              <Plus size={16} /> Add another contractor
            </button>
            <div className="flex justify-between pt-2">
              <Button variant="outline" type="button" onClick={() => setStep(2)}>Back</Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        </div>
      )}

      {step === 4 && (
        <div className="card">
          <h2 className="text-base font-semibold text-navy mb-4">Step 4 — Documentation upload</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-navy mb-1">Upload existing documents</p>
            <p className="text-xs text-gray-500 mb-4">Previous OSSPs, site maps, risk assessments, licence conditions</p>
            <p className="text-xs text-gray-400 italic">Files will be stored securely in Supabase storage</p>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" type="button" onClick={() => setStep(3)}>Back</Button>
            <Button onClick={() => setStep(5)}>Continue</Button>
          </div>
        </div>
      )}

      {step === 5 && step1Data && step2Data && (
        <div className="card">
          <h2 className="text-base font-semibold text-navy mb-4">Step 5 — Review and submit</h2>
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Organisation</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-500">Company</dt><dd className="text-navy font-medium">{step1Data.company_name}</dd>
                <dt className="text-gray-500">Contact</dt><dd className="text-navy">{step1Data.primary_contact_name}</dd>
                <dt className="text-gray-500">Email</dt><dd className="text-navy">{step1Data.primary_contact_email}</dd>
              </dl>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Event</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-500">Event name</dt><dd className="text-navy font-medium">{step2Data.event_name}</dd>
                <dt className="text-gray-500">Venue</dt><dd className="text-navy">{step2Data.venue_name}</dd>
                <dt className="text-gray-500">Dates</dt><dd className="text-navy">{step2Data.start_date} → {step2Data.end_date}</dd>
                <dt className="text-gray-500">Attendance</dt><dd className="text-navy">{step2Data.expected_attendance?.toLocaleString()}</dd>
              </dl>
            </div>
            {step3Data?.contractors && step3Data.contractors.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contractors ({step3Data.contractors.length})</h3>
                {step3Data.contractors.filter(c => c.company_name).map((c, i) => (
                  <p key={i} className="text-sm text-navy">{c.company_name} — {c.type}</p>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(4)}>Back</Button>
            <Button onClick={onSubmit} loading={submitting}>Submit for review</Button>
          </div>
        </div>
      )}
    </div>
  )
}
