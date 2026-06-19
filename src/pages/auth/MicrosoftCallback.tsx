import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getMicrosoftCallbackParams } from '../../lib/microsoftAuth'
import { api } from '../../lib/api'
import type { User } from '../../types'

const TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID as string
const CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID as string

export function MicrosoftCallback() {
  const { setAuthenticatedUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      // Check for error from Microsoft
      const urlParams = new URLSearchParams(window.location.search)
      const urlError = urlParams.get('error_description') ?? urlParams.get('error')
      if (urlError) { setError(urlError); return }

      // Recover PKCE verifier and validate state
      const params = getMicrosoftCallbackParams()
      if (!params) { setError('Sign-in link is invalid or expired. Please try again.'); return }

      // Exchange code for tokens — must happen from the browser (SPA redirect URI requirement)
      const redirectUri = `${window.location.origin}/auth/callback`
      const tokenRes = await fetch(
        `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'authorization_code',
            code: params.code,
            redirect_uri: redirectUri,
            code_verifier: params.verifier,
            scope: 'openid profile email',
          }).toString(),
        }
      )

      const tokens = await tokenRes.json() as { id_token?: string; error_description?: string; error?: string }
      if (!tokenRes.ok || !tokens.id_token) {
        setError(tokens.error_description ?? tokens.error ?? 'Token exchange failed')
        return
      }

      // Send id_token to our backend for validation and Tide JWT issuance
      try {
        const { token, user } = await api.post<{ token: string; user: User }>('/auth/microsoft', {
          idToken: tokens.id_token,
        })
        setAuthenticatedUser(token, user)
        if (user.role === 'super_admin') navigate('/admin', { replace: true })
        else if (user.role === 'client_staff') navigate('/app/select-event', { replace: true })
        else navigate('/client', { replace: true })
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Microsoft sign-in failed')
      }
    }

    handleCallback()
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
