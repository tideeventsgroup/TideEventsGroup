import React from 'react'

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className ?? 'h-64'}`}>
      <svg className="animate-spin h-8 w-8 text-teal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-surface flex items-center justify-center">
      <div className="text-center">
        <svg className="animate-spin h-10 w-10 text-teal mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    </div>
  )
}
