import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { WifiOff } from 'lucide-react'

export function AppLayout() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  return (
    <div className="min-h-screen bg-surface max-w-sm mx-auto">
      {!online && (
        <div className="flex items-center justify-center gap-2 bg-amber/15 text-amber-800 text-xs py-2 px-4">
          <WifiOff size={14} />
          <span>Offline — incidents will sync when reconnected</span>
        </div>
      )}
      <Outlet />
    </div>
  )
}
