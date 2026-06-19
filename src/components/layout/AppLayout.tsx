import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, BookOpen, Map, Phone, List, WifiOff } from 'lucide-react'

const NAV_TABS = [
  { to: '/app', label: 'Home',      icon: Home,    end: true },
  { to: '/app/briefing',  label: 'Briefing',  icon: BookOpen },
  { to: '/app/site-map',  label: 'Map',       icon: Map },
  { to: '/app/emergency', label: 'Emergency', icon: Phone },
  { to: '/app/incidents', label: 'Incidents', icon: List },
]

export function AppLayout() {
  const [online, setOnline] = useState(navigator.onLine)
  const location = useLocation()
  const isSelectEvent = location.pathname === '/app/select-event'

  useEffect(() => {
    const up = () => setOnline(true)
    const dn = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', dn)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', dn) }
  }, [])

  return (
    <div
      className="flex flex-col"
      style={{
        background: '#0D0E12',
        minHeight: '100dvh',
        maxWidth: 430,
        margin: '0 auto',
        color: '#F0F1F5',
      }}
    >
      {!online && (
        <div
          className="flex items-center justify-center gap-2 text-xs py-2 px-4 flex-shrink-0"
          style={{ background: 'rgba(239,159,39,0.15)', color: '#EF9F27', borderBottom: '1px solid rgba(239,159,39,0.2)' }}
          role="status"
          aria-live="polite"
        >
          <WifiOff size={12} />
          <span>Offline — incidents sync when reconnected</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: isSelectEvent ? 0 : 72 }}>
        <Outlet />
      </div>

      {!isSelectEvent && (
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full flex items-center justify-around z-50"
          style={{
            maxWidth: 430,
            height: 68,
            background: 'rgba(14,15,20,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {NAV_TABS.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-150 min-w-[56px] ${
                  isActive ? '' : 'opacity-40'
                }`
              }
              style={({ isActive }) => isActive ? { color: '#E8521A' } : { color: '#F0F1F5' }}
            >
              <tab.icon size={20} strokeWidth={2} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
