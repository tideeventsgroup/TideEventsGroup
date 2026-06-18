import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { msalInstance } from '../../lib/msal'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { User } from '../../types'

export function MsalCallback() {
  const { setAuthenticatedUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      try {
        await msalInstance.initialize()
        const result = await msalInstance.handleRedirectPromise()

        if (!result) {
          // No redirect result — maybe user landed here directly
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

    handleCallback()
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
      <div className="text-white/60 text-sm">Signing you in…</div>
    </div>
  )
}
