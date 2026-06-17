import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone } from 'lucide-react'

const CONTACTS = [
  { role: 'Event control', name: null, phone: null },
  { role: 'Medical post 1', name: null, phone: null },
  { role: 'Medical post 2', name: null, phone: null },
  { role: 'Police liaison', name: null, phone: null },
  { role: 'Fire liaison', name: null, phone: null },
  { role: 'Tide consultant', name: null, phone: '07700 900000' },
  { role: 'Security supervisor', name: null, phone: null },
  { role: 'Emergency services', name: 'Police / Ambulance / Fire', phone: '999' },
]

export function EmergencyContacts() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface pb-8">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 bg-white border-b border-gray-200 sticky top-0">
        <button onClick={() => navigate('/app')} className="p-2 -ml-2">
          <ArrowLeft size={20} className="text-navy" />
        </button>
        <h1 className="text-base font-semibold text-navy">Emergency contacts</h1>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <p className="text-xs text-gray-500 mb-4">Tap a number to call. This list is available offline.</p>

        {CONTACTS.map((contact, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-navy">{contact.role}</p>
              {contact.name && <p className="text-xs text-gray-500">{contact.name}</p>}
              {!contact.phone && <p className="text-xs text-gray-400">Number to be confirmed</p>}
            </div>
            {contact.phone ? (
              <a
                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-2 bg-teal text-white px-4 py-3 rounded-lg text-sm font-medium min-w-[48px] min-h-[48px] justify-center"
              >
                <Phone size={16} />
                {contact.phone}
              </a>
            ) : (
              <div className="px-4 py-3 rounded-lg bg-gray-100 text-gray-400 text-sm min-w-[48px] min-h-[48px] flex items-center">
                TBC
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
