const CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID as string
const TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID as string

export const msalEnabled = !!(CLIENT_ID && TENANT_ID)

function base64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function generatePKCE() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32))
  const verifier = base64urlEncode(verifierBytes)
  const challengeBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const challenge = base64urlEncode(new Uint8Array(challengeBuffer))
  return { verifier, challenge }
}

export async function signInWithMicrosoft(): Promise<void> {
  const { verifier, challenge } = await generatePKCE()
  const state = base64urlEncode(crypto.getRandomValues(new Uint8Array(16)))

  sessionStorage.setItem('ms_pkce_verifier', verifier)
  sessionStorage.setItem('ms_oauth_state', state)

  const redirectUri = `${window.location.origin}/auth/callback`

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'openid profile email',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })

  window.location.href = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params}`
}

export function getMicrosoftCallbackParams(): { code: string; verifier: string } | null {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')
  const savedState = sessionStorage.getItem('ms_oauth_state')
  const verifier = sessionStorage.getItem('ms_pkce_verifier')

  sessionStorage.removeItem('ms_pkce_verifier')
  sessionStorage.removeItem('ms_oauth_state')

  if (!code || !verifier || state !== savedState) return null
  return { code, verifier }
}
