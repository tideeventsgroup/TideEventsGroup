import { PublicClientApplication, type Configuration, type AuthenticationResult } from '@azure/msal-browser'

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID as string | undefined

export const msalEnabled = !!(clientId && tenantId)

const config: Configuration = {
  auth: {
    clientId: clientId ?? 'not-configured',
    authority: `https://login.microsoftonline.com/${tenantId ?? 'common'}`,
    redirectUri: `${window.location.origin}/auth/callback`,
    postLogoutRedirectUri: `${window.location.origin}/login`,
  },
  cache: { cacheLocation: 'sessionStorage' },
}

export const msalInstance = new PublicClientApplication(config)

// Initialise once and resolve any in-flight redirect
let initPromise: Promise<AuthenticationResult | null> | null = null

export function getMsalInit(): Promise<AuthenticationResult | null> {
  if (!initPromise) {
    initPromise = msalInstance
      .initialize()
      .then(() => msalInstance.handleRedirectPromise())
      .catch(() => null)
  }
  return initPromise
}

export async function signInWithMicrosoft(): Promise<void> {
  await getMsalInit()
  await msalInstance.loginRedirect({
    scopes: ['openid', 'profile', 'email'],
    prompt: 'select_account',
  })
}
