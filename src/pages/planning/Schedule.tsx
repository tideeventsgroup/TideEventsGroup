import React from 'react'
import { ClipboardList } from 'lucide-react'
export function PlanningSchedule() {
  return (
    <div className="flex flex-col items-center justify-center h-96 p-8">
      <ClipboardList size={48} className="text-gray-200 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Staff Schedule</h2>
      <p className="text-gray-400 text-sm text-center max-w-sm">Schedule management — assign shifts, rosters, and availability for all event staff.</p>
      <p className="text-gray-300 text-xs mt-4">Coming soon in the next release.</p>
    </div>
  )
}
