import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Circle, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import type { MartynCompliance, ComplianceStatus } from '../../types'

const PROCEDURES = [
  { key: 'counter_terrorism_procedures', label: 'Counter-terrorism procedures' },
  { key: 'evacuation_procedures', label: 'Evacuation procedures' },
  { key: 'invacuation_procedures', label: 'Invacuation procedures' },
  { key: 'shelter_in_place_procedures', label: 'Shelter in place procedures' },
  { key: 'lockdown_procedures', label: 'Lockdown procedures' },
]

const MEASURES = [
  { key: 'training_staff', label: 'Training staff' },
  { key: 'communicating_staff', label: 'Communicating with staff' },
  { key: 'communicating_public', label: 'Communicating with the public' },
  { key: 'working_with_others', label: 'Working with others' },
]

function StatusIcon({ status }: { status: ComplianceStatus }) {
  if (status === 'complete') return <CheckCircle size={20} className="text-teal flex-shrink-0" />
  if (status === 'in_progress') return <Clock size={20} className="text-amber flex-shrink-0" />
  return <Circle size={20} className="text-gray-300 flex-shrink-0" />
}

const statusCycle: ComplianceStatus[] = ['not_started', 'in_progress', 'complete']

export function Compliance() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: items = [] } = useQuery({
    queryKey: ['compliance', user?.tenant_id],
    enabled: !!user?.tenant_id,
    queryFn: async () => {
      const { data } = await supabase.from('martyn_compliance').select('*').eq('tenant_id', user!.tenant_id!)
      return (data ?? []) as MartynCompliance[]
    }
  })

  const upsert = useMutation({
    mutationFn: async ({ key, status }: { key: string; status: ComplianceStatus }) => {
      await supabase.from('martyn_compliance').upsert({
        tenant_id: user!.tenant_id!,
        item_key: key,
        status,
        updated_by: user!.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,event_id,item_key' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance'] })
  })

  function getStatus(key: string): ComplianceStatus {
    return items.find(i => i.item_key === key)?.status ?? 'not_started'
  }

  function cycleStatus(key: string) {
    const current = getStatus(key)
    const idx = statusCycle.indexOf(current)
    const next = statusCycle[(idx + 1) % statusCycle.length]
    upsert.mutate({ key, status: next })
  }

  const allItems = [...PROCEDURES, ...MEASURES]
  const completeCount = allItems.filter(i => getStatus(i.key) === 'complete').length
  const percent = Math.round((completeCount / allItems.length) * 100)

  function ItemRow({ item }: { item: { key: string; label: string } }) {
    const status = getStatus(item.key)
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <div className="flex items-center gap-3">
          <StatusIcon status={status} />
          <span className="text-sm text-navy">{item.label}</span>
        </div>
        <button
          onClick={() => cycleStatus(item.key)}
          className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
            status === 'complete' ? 'bg-teal/10 text-teal-dark hover:bg-teal/20' :
            status === 'in_progress' ? 'bg-amber/15 text-amber-700 hover:bg-amber/25' :
            'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {status === 'complete' ? 'Complete' : status === 'in_progress' ? 'In progress' : 'Not started'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-navy">Martyn's Law compliance</h1>
        <p className="text-sm text-gray-500 mt-1">{completeCount} of {allItems.length} items complete · {percent}%</p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div className="bg-teal h-2 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-navy mb-2">Procedures</h2>
          <p className="text-xs text-gray-500 mb-4">Counter-terrorism and emergency procedures</p>
          {PROCEDURES.map(item => <ItemRow key={item.key} item={item} />)}
        </div>
        <div className="card">
          <h2 className="text-base font-semibold text-navy mb-2">Measures</h2>
          <p className="text-xs text-gray-500 mb-4">Staff training and communication measures</p>
          {MEASURES.map(item => <ItemRow key={item.key} item={item} />)}
        </div>
      </div>
    </div>
  )
}
