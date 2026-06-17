import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { WifiOff } from 'lucide-react'

export function AppLayout() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  return (
    <div className="min-h-dvh bg-surface" style={{ maxWidth: 430, margin: '0 auto' }}>
      {!online && (
        <div
          className="flex items-center justify-center gap-2 text-xs py-2.5 px-4"
          style={{ backgroundColor: '#FEF9EE', color: '#92400E', borderBottom: '1px solid #FDE68A' }}
          role="status"
          aria-live="polite"
        >
          <WifiOff size={13} />
          <span>Offline — incidents will sync when reconnected</span>
        </div>
      )}
      <Outlet />
    </div>
  )
}
