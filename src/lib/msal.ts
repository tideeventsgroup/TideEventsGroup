import { PublicClientApplication, type Configuration, type AuthenticationResult, BrowserAuthError } from '@azure/msal-browser'

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID as string | undefined

export const msalEnabled = !!(clientId && tenantId)

const config: Configuration = {
  auth: {
    clientId: clientId ?? 'not-configured',
    authority: `https://login.microsoftonline.com/${tenantId ?? 'common'}`,
    redirectUri: `${window.location.origin}/auth/callback`,
  },
  cache: { cacheLocation: 'sessionStorage' },
}

export const msalInstance = new PublicClientApplication(config)

let initialised = false

async function ensureInitialised() {
  if (initialised) return
  await msalInstance.initialize()
  await msalInstance.handleRedirectPromise().catch(() => {})
  initialised = true
}

export async function signInWithMicrosoft(): Promise<AuthenticationResult> {
  await ensureInitialised()

  try {
    return await msalInstance.loginPopup({
      scopes: ['openid', 'profile', 'email'],
      prompt: 'select_account',
    })
  } catch (err) {
    // Clear stale interaction lock and retry once
    if (err instanceof BrowserAuthError && err.errorCode === 'interaction_in_progress') {
      sessionStorage.clear()
      await msalInstance.initialize()
      initialised = true
      return msalInstance.loginPopup({
        scopes: ['openid', 'profile', 'email'],
        prompt: 'select_account',
      })
    }
    throw err
  }
}
