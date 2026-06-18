import React from 'react'
import { Map } from 'lucide-react'
export function PlanningSiteMap() {
  return (
    <div className="flex flex-col items-center justify-center h-96 p-8">
      <Map size={48} className="text-gray-200 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Site Mapping</h2>
      <p className="text-gray-400 text-sm text-center max-w-sm">Interactive venue mapping — mark entrances, exits, medical posts, security posts, welfare points, and RVPs.</p>
      <p className="text-gray-300 text-xs mt-4">Azure Maps integration — coming soon.</p>
    </div>
  )
}
