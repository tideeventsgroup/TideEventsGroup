import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Radio, Phone as PhoneIcon, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function MyBriefing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const eventName = localStorage.getItem('tide_event_name') ?? 'Your event'

  return (
    <div className="min-h-screen bg-surface pb-8">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 bg-white border-b border-gray-200 sticky top-0">
        <button onClick={() => navigate('/app')} className="p-2 -ml-2">
          <ArrowLeft size={20} className="text-navy" />
        </button>
        <h1 className="text-base font-semibold text-navy">My briefing</h1>
      </div>

      <div className="px-4 pt-4 space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-navy border-b border-gray-200 pb-2 mb-3">Welcome and event overview</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Welcome to <strong>{eventName}</strong>. Thank you for being part of the safety and security team for this event.
            Your role is critical to ensuring the safety and wellbeing of everyone on site.
            Please read this briefing carefully before your shift begins.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-navy border-b border-gray-200 pb-2 mb-3">Your role and zone</h2>
          <div className="bg-navy/5 rounded-lg p-4">
            <p className="text-sm text-navy font-medium">{user?.name ?? 'Staff member'}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
            <p className="text-xs text-gray-500 mt-1">Zone assignment will be confirmed by your supervisor at briefing.</p>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-navy border-b border-gray-200 pb-2 mb-3">Command structure</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Event control</span>
              <span className="text-navy font-medium">Central command</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Safety officer</span>
              <span className="text-navy">Assigned at briefing</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Tide consultant</span>
              <span className="text-navy">On site throughout</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-navy border-b border-gray-200 pb-2 mb-3">Emergency procedures</h2>
          <div className="bg-danger/5 border border-danger/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-danger" />
              <span className="text-sm font-semibold text-danger">Run / Hide / Tell</span>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-navy">RUN</span>
                <p className="text-gray-600 text-xs mt-0.5">Escape if it is safe to do so. Leave belongings behind.</p>
              </div>
              <div>
                <span className="font-semibold text-navy">HIDE</span>
                <p className="text-gray-600 text-xs mt-0.5">If you cannot run, find cover from gunfire. Be quiet and silence your phone.</p>
              </div>
              <div>
                <span className="font-semibold text-navy">TELL</span>
                <p className="text-gray-600 text-xs mt-0.5">Call 999 when it is safe to do so. Tell police what you know.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-navy border-b border-gray-200 pb-2 mb-3">Radio channels</h2>
          <div className="space-y-2 text-sm">
            {[
              { ch: '1', label: 'Event control' },
              { ch: '2', label: 'Security team' },
              { ch: '3', label: 'Medical' },
              { ch: '4', label: 'Stewarding' },
            ].map(r => (
              <div key={r.ch} className="flex items-center gap-3 py-2 border-b border-gray-100">
                <div className="h-7 w-7 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                  <Radio size={12} className="text-white" />
                </div>
                <span className="text-gray-500">Channel {r.ch}</span>
                <span className="text-navy font-medium">{r.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
