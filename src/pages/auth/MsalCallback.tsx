import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createMsalInstance } from '../../lib/msal'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { User } from '../../types'

export function MsalCallback() {
  const { setAuthenticatedUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handle() {
      try {
        const instance = createMsalInstance()
        await instance.initialize()
        const result = await instance.handleRedirectPromise()

        if (!result) {
          // No redirect result in URL — send back to login
          navigate('/login', { replace: true })
          return
        }

        const { token, user } = await api.post<{ token: string; user: User }>('/auth/microsoft', {
          idToken: result.idToken,
        })

        setAuthenticatedUser(token, user)

        if (user.role === 'super_admin') navigate('/admin', { replace: true })
        else if (user.role === 'client_staff') navigate('/app/select-event', { replace: true })
        else navigate('/client', { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign-in failed')
      }
    }
    handle()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <p className="text-danger text-sm mb-4">{error}</p>
          <button onClick={() => navigate('/login', { replace: true })} className="btn-primary">
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
      <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex items-center gap-3">
        <svg className="animate-spin h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span className="text-navy text-sm font-medium">Signing you in…</span>
      </div>
    </div>
  )
}
