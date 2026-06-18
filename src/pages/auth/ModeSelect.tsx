import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, Radio, ChevronRight, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { TideLogo } from '../../components/ui/TideLogo'
import { ROLE_LABELS, ROLE_MODES } from '../../types'
import type { AppMode } from '../../types'

export function ModeSelect() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const availableModes = ROLE_MODES[user.role] ?? ['live']

  function select(mode: AppMode) {
    if (mode === 'planning') navigate('/planning')
    else navigate('/live')
  }

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: '#0A0B0F' }}>

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.02) 0,rgba(255,255,255,0.02) 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,rgba(255,255,255,0.02) 0,rgba(255,255,255,0.02) 1px,transparent 1px,transparent 60px)',
      }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <TideLogo variant="full-white" height={32} />
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white text-sm font-semibold">{user.name}</p>
            <p className="text-white/40 text-xs">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors text-xs"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {/* Centre */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        <div className="mb-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'rgba(232,82,26,0.12)', color: '#E8521A', border: '1px solid rgba(232,82,26,0.2)' }}>
            <Shield size={11} /> Tactical Incident &amp; Dispatch Environment
          </span>
        </div>
        <h1 className="text-4xl font-extrabold text-white mt-4 mb-2 text-center tracking-tight" style={{ letterSpacing: '-0.03em' }}>
          Select Operating Mode
        </h1>
        <p className="text-white/40 text-sm mb-12 text-center">
          Choose the mode for this session. Each mode provides a separate environment.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">

          {/* Planning Mode */}
          <button
            onClick={() => select('planning')}
            disabled={!availableModes.includes('planning')}
            className="group relative rounded-2xl p-7 text-left transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: availableModes.includes('planning')
                ? 'linear-gradient(135deg,rgba(91,140,255,0.08) 0%,rgba(91,140,255,0.04) 100%)'
                : 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(91,140,255,0.2)',
            }}
          >
            <div className="flex items-center justify-center rounded-2xl mb-5"
              style={{ background: 'rgba(91,140,255,0.1)', width: 56, height: 56 }}>
              <Layers size={26} style={{ color: '#5B8CFF' }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Planning Mode</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              Event creation, risk registers, resource planning, staff scheduling, and document management.
            </p>
            <ul className="space-y-1.5 mb-6">
              {['Event Setup & Configuration','Risk Register','Resource Planning','Staff Scheduling','Document Library'].map(f => (
                <li key={f} className="flex items-center gap-2 text-white/40 text-xs">
                  <span className="h-1 w-1 rounded-full bg-blue-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#5B8CFF' }}>
              Enter Planning Mode <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Live Event Mode */}
          <button
            onClick={() => select('live')}
            disabled={!availableModes.includes('live')}
            className="group relative rounded-2xl p-7 text-left transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: availableModes.includes('live')
                ? 'linear-gradient(135deg,rgba(232,82,26,0.1) 0%,rgba(232,82,26,0.04) 100%)'
                : 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(232,82,26,0.25)',
            }}
          >
            {/* Live pulse */}
            <div className="absolute top-5 right-5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full live-dot" style={{ background: '#34C759' }} />
              <span className="text-xs font-semibold" style={{ color: '#34C759' }}>LIVE</span>
            </div>

            <div className="flex items-center justify-center rounded-2xl mb-5"
              style={{ background: 'rgba(232,82,26,0.12)', width: 56, height: 56 }}>
              <Radio size={26} style={{ color: '#E8521A' }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Live Event Mode</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              Real-time CAD operations, incident dispatch, resource tracking, and Silver Command oversight.
            </p>
            <ul className="space-y-1.5 mb-6">
              {['Computer Aided Dispatch','Incident Management','Resource Tracking','Communications Log','Major Incident Control'].map(f => (
                <li key={f} className="flex items-center gap-2 text-white/40 text-xs">
                  <span className="h-1 w-1 rounded-full bg-orange-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#E8521A' }}>
              Enter Live Mode <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

        </div>

        <p className="text-white/20 text-xs mt-10 text-center">
          Modes are fully isolated. No shared data between sessions.
        </p>
      </div>

      <div className="relative z-10 pb-6 text-center">
        <p className="text-white/15 text-xs">© {new Date().getFullYear()} Tide Events Group Ltd · TIDE v2.0</p>
      </div>
    </div>
  )
}
