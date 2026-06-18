import React from 'react'
import { FolderOpen } from 'lucide-react'
export function PlanningDocuments() {
  return (
    <div className="flex flex-col items-center justify-center h-96 p-8">
      <FolderOpen size={48} className="text-gray-200 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Document Library</h2>
      <p className="text-gray-400 text-sm text-center max-w-sm">Store and manage your EMP, RAMS, site licences, insurance certificates, emergency procedures, and SAG submissions.</p>
      <p className="text-gray-300 text-xs mt-4">Document vault available in the existing client portal.</p>
    </div>
  )
}
