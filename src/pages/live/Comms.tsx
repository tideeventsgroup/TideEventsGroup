import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Radio, Phone, Mail, MessageSquare, Send, Filter, Plus } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { TideEvent, CommsLog, Broadcast } from '../../types'

const TYPES = [
  { value: 'radio', label: 'Radio', icon: Radio, color: '#FF9500' },
  { value: 'phone', label: 'Phone', icon: Phone, color: '#5B8CFF' },
  { value: 'email', label: 'Email', icon: Mail, color: '#4ECDC4' },
  { value: 'broadcast', label: 'Broadcast', icon: MessageSquare, color: '#FF3B30' },
  { value: 'log', label: 'Log Entry', icon: MessageSquare, color: '#636366' },
]

function TypeIcon({ type }: { type: string }) {
  const t = TYPES.find(x => x.value === type)
  if (!t) return null
  const Icon = t.icon
  return <Icon size={13} style={{ color: t.color }} />
}

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function datStr(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function LiveComms() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [activeTab, setActiveTab] = useState<'all' | 'radio' | 'phone' | 'broadcast'>('all')
  const [newMsg, setNewMsg] = useState('')
  const [newFrom, setNewFrom] = useState('')
  const [newTo, setNewTo] = useState('')
  const [newChannel, setNewChannel] = useState('Ch.1')
  const [newType, setNewType] = useState<'radio' | 'phone' | 'log' | 'broadcast'>('radio')
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'urgent' | 'critical'>('normal')

  const { data: events = [] } = useQuery({
    queryKey: ['live-events'],
    queryFn: () => api.get<TideEvent[]>('/events?status=live'),
  })
  const liveEvent = events[0] ?? null

  const commsParams = new URLSearchParams()
  if (liveEvent) commsParams.set('event_id', liveEvent.id)
  if (activeTab !== 'all') commsParams.set('type', activeTab)
  commsParams.set('limit', '200')

  const { data: logs = [], refetch } = useQuery({
    queryKey: ['comms', liveEvent?.id, activeTab],
    queryFn: () => api.get<CommsLog[]>(`/comms?${commsParams}`),
    enabled: !!liveEvent,
    refetchInterval: 10000,
  })

  const { data: broadcasts = [] } = useQuery({
    queryKey: ['broadcasts', liveEvent?.id],
    queryFn: () => liveEvent ? api.get<Broadcast[]>(`/broadcasts?event_id=${liveEvent.id}`) : Promise.resolve([]),
    enabled: !!liveEvent,
    refetchInterval: 15000,
  })

  const logMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/comms', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comms'] }); setNewMsg(''); setNewFrom(''); setNewTo('') },
  })

  const broadcastMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/broadcasts', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['broadcasts'] }); setShowBroadcast(false); setBroadcastMsg('') },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  function submitLog() {
    if (!newMsg.trim() || !liveEvent) return
    logMutation.mutate({
      event_id: liveEvent.id,
      tenant_id: liveEvent.tenant_id,
      type: newType,
      direction: 'internal',
      from_callsign: newFrom || user?.name || 'Control',
      to_callsign: newTo || null,
      channel: newChannel,
      message: newMsg,
    })
  }

  const logsReversed = [...logs].reverse()
  const canBroadcast = user && ['silver_command','event_manager','comms_officer','super_admin'].includes(user.role)

  return (
    <div className="flex flex-col h-full" style={{ background: '#0A0B0F' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h1 className="text-white font-bold text-lg">Communications</h1>
          <p className="text-white/30 text-xs">{logs.length} entries · {broadcasts.length} broadcasts</p>
        </div>
        <div className="flex items-center gap-2">
          {(['all','radio','phone','broadcast'] as const).map(t => (
            <button key={t}
              onClick={() => setActiveTab(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{
                background: activeTab === t ? 'rgba(232,82,26,0.15)' : 'rgba(255,255,255,0.05)',
                color: activeTab === t ? '#E8521A' : 'rgba(255,255,255,0.4)',
                border: activeTab === t ? '1px solid rgba(232,82,26,0.3)' : '1px solid transparent',
              }}>
              {t}
            </button>
          ))}
          {canBroadcast && (
            <button
              onClick={() => setShowBroadcast(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white ml-2"
              style={{ background: '#E8521A' }}>
              <MessageSquare size={14} /> Broadcast
            </button>
          )}
        </div>
      </div>

      {/* Latest broadcasts */}
      {broadcasts.length > 0 && activeTab !== 'radio' && activeTab !== 'phone' && (
        <div className="px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {broadcasts.slice(0, 3).map(b => (
              <div key={b.id} className="flex-shrink-0 rounded-xl px-4 py-2.5 max-w-xs"
                style={{
                  background: b.priority === 'critical' ? 'rgba(255,59,48,0.12)' : b.priority === 'urgent' ? 'rgba(255,149,0,0.12)' : 'rgba(91,140,255,0.08)',
                  border: `1px solid ${b.priority === 'critical' ? 'rgba(255,59,48,0.3)' : b.priority === 'urgent' ? 'rgba(255,149,0,0.3)' : 'rgba(91,140,255,0.2)'}`,
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: b.priority === 'critical' ? '#FF3B30' : b.priority === 'urgent' ? '#FF9500' : '#5B8CFF' }}>
                    {b.priority} broadcast
                  </span>
                  <span className="text-white/20 text-xs">{timeStr(b.created_at)}</span>
                </div>
                <p className="text-white text-xs">{b.message}</p>
                <p className="text-white/30 text-xs mt-1">— {b.sent_by_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log list */}
      <div className="flex-1 overflow-auto px-5 py-3">
        <div className="space-y-1">
          {logsReversed.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-white/20">
              <Radio size={24} className="mb-2" />
              <p className="text-xs">No communications logged yet</p>
            </div>
          )}
          {logsReversed.map((log, i) => {
            const t = TYPES.find(x => x.value === log.type)
            return (
              <div key={log.id} className="flex items-start gap-3 py-2 px-3 rounded-xl hover:bg-white/3 transition-colors">
                <div className="flex-shrink-0 pt-0.5">
                  <TypeIcon type={log.type} />
                </div>
                <div className="flex-shrink-0 text-xs font-mono text-white/25 pt-0.5 w-16">
                  {timeStr(log.created_at)}
                </div>
                {log.from_callsign && (
                  <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded"
                    style={{ background: 'rgba(255,149,0,0.1)', color: '#FF9500' }}>
                    {log.from_callsign}
                  </span>
                )}
                {log.to_callsign && (
                  <>
                    <span className="text-white/20 text-xs flex-shrink-0">→</span>
                    <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: 'rgba(91,140,255,0.1)', color: '#5B8CFF' }}>
                      {log.to_callsign}
                    </span>
                  </>
                )}
                {log.channel && (
                  <span className="flex-shrink-0 text-xs text-white/25">[{log.channel}]</span>
                )}
                <p className="text-white text-xs flex-1">{log.message}</p>
                {log.logged_by_name && (
                  <span className="flex-shrink-0 text-white/20 text-xs">{log.logged_by_name}</span>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Log input */}
      <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-end gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <select value={newType} onChange={e => setNewType(e.target.value as any)}
              className="px-2 py-2 rounded-lg text-xs text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <option value="radio">Radio</option>
              <option value="phone">Phone</option>
              <option value="log">Log</option>
            </select>
            <input value={newFrom} onChange={e => setNewFrom(e.target.value)}
              placeholder="From"
              className="w-24 px-2 py-2 rounded-lg text-xs text-white placeholder-white/20 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <input value={newTo} onChange={e => setNewTo(e.target.value)}
              placeholder="To"
              className="w-24 px-2 py-2 rounded-lg text-xs text-white placeholder-white/20 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <input value={newChannel} onChange={e => setNewChannel(e.target.value)}
              placeholder="Ch."
              className="w-16 px-2 py-2 rounded-lg text-xs text-white placeholder-white/20 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
          <input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitLog()}
            placeholder="Log a communication or note… (Enter to submit)"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <button onClick={submitLog} disabled={!newMsg.trim() || !liveEvent}
            className="px-4 py-2.5 rounded-xl font-bold text-white disabled:opacity-30 flex-shrink-0"
            style={{ background: '#E8521A' }}>
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Broadcast modal */}
      {showBroadcast && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 className="text-white font-bold text-lg mb-5">Send Broadcast</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['normal','urgent','critical'] as const).map(p => (
                  <button key={p} onClick={() => setBroadcastPriority(p)}
                    className="py-2 rounded-xl text-sm font-bold capitalize transition-all"
                    style={{
                      background: broadcastPriority === p ? (p === 'critical' ? 'rgba(255,59,48,0.2)' : p === 'urgent' ? 'rgba(255,149,0,0.2)' : 'rgba(91,140,255,0.15)') : 'rgba(255,255,255,0.05)',
                      color: broadcastPriority === p ? (p === 'critical' ? '#FF3B30' : p === 'urgent' ? '#FF9500' : '#5B8CFF') : 'rgba(255,255,255,0.4)',
                      border: broadcastPriority === p ? `1px solid currentColor` : '1px solid transparent',
                    }}>
                    {p}
                  </button>
                ))}
              </div>
              <textarea
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
                placeholder="Broadcast message to all staff…"
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => liveEvent && broadcastMutation.mutate({
                  event_id: liveEvent.id, tenant_id: liveEvent.tenant_id,
                  message: broadcastMsg, priority: broadcastPriority,
                })}
                disabled={!broadcastMsg.trim() || broadcastMutation.isPending}
                className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-40"
                style={{ background: broadcastPriority === 'critical' ? '#FF3B30' : '#E8521A' }}>
                {broadcastMutation.isPending ? 'Sending…' : 'Send Broadcast'}
              </button>
              <button onClick={() => setShowBroadcast(false)}
                className="px-5 py-3 rounded-xl font-semibold text-white/50"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
