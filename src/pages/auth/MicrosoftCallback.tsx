import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getMicrosoftCallbackParams } from '../../lib/microsoftAuth'
import { api } from '../../lib/api'
import type { User } from '../../types'

export function MicrosoftCallback() {
  const { setAuthenticatedUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const urlError = new URLSearchParams(window.location.search).get('error_description')
    if (urlError) { setError(urlError); return }

    const params = getMicrosoftCallbackParams()
    if (!params) {
      setError('Sign-in link is invalid or expired. Please try again.')
      return
    }

    api.post<{ token: string; user: User }>('/auth/microsoft', {
      code: params.code,
      codeVerifier: params.verifier,
      redirectUri: `${window.location.origin}/auth/callback`,
    })
      .then(({ token, user }) => {
        setAuthenticatedUser(token, user)
        if (user.role === 'super_admin') navigate('/admin', { replace: true })
        else if (user.role === 'client_staff') navigate('/app/select-event', { replace: true })
        else navigate('/client', { replace: true })
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Microsoft sign-in failed')
      })
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <p className="text-red-600 font-medium mb-4 text-sm">{error}</p>
          <button onClick={() => navigate('/login', { replace: true })} className="text-sm text-navy underline">
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
      <div className="text-white/50 text-sm">Completing sign in…</div>
    </div>
  )
}
