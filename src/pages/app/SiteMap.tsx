import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Map } from 'lucide-react'

export function SiteMap() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 bg-white border-b border-gray-200 sticky top-0">
        <button onClick={() => navigate('/app')} className="p-2 -ml-2">
          <ArrowLeft size={20} className="text-navy" />
        </button>
        <h1 className="text-base font-semibold text-navy">Site map</h1>
      </div>

      <div className="p-4">
        <p className="text-xs text-gray-500 mb-4">Pinch to zoom. Tap a zone for details.</p>

        <div className="bg-gray-100 rounded-xl flex flex-col items-center justify-center text-center p-8 min-h-[60vh]">
          <Map size={48} className="text-gray-300 mb-4" />
          <p className="text-sm font-medium text-gray-500">Site map not yet uploaded</p>
          <p className="text-xs text-gray-400 mt-1">
            The event organiser can upload a site map via the planning portal.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Zones</p>
          {['Main stage', 'Medical post 1', 'Entry gate north', 'Control room', 'Evacuation assembly point A'].map(z => (
            <div key={z} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
              <div className="h-3 w-3 rounded-full bg-teal flex-shrink-0" />
              <span className="text-sm text-navy">{z}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
