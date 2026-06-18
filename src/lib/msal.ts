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

  const request = {
    scopes: ['openid', 'profile', 'email'],
    prompt: 'select_account' as const,
  }

  try {
    return await msalInstance.loginPopup(request)
  } catch (err) {
    if (err instanceof BrowserAuthError && err.errorCode === 'interaction_in_progress') {
      sessionStorage.clear()
      initialised = false
      await ensureInitialised()
      return msalInstance.loginPopup(request)
    }
    // Popup blocked — fall back to redirect
    if (err instanceof BrowserAuthError && err.errorCode === 'popup_window_error') {
      await msalInstance.loginRedirect(request)
      return {} as AuthenticationResult // redirect will navigate away
    }
    throw err
  }
}
