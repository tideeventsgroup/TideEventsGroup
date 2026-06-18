import React from 'react'
import { BarChart2 } from 'lucide-react'
export function PlanningReports() {
  return (
    <div className="flex flex-col items-center justify-center h-96 p-8">
      <BarChart2 size={48} className="text-gray-200 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Planning Reports</h2>
      <p className="text-gray-400 text-sm text-center max-w-sm">Generate event planning reports, after-action reviews, and resource utilisation summaries.</p>
    </div>
  )
}
