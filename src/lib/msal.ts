import { PublicClientApplication, type Configuration, type AuthenticationResult } from '@azure/msal-browser'

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID as string | undefined

export const msalEnabled = !!(clientId && tenantId)

const config: Configuration = {
  auth: {
    clientId: clientId ?? 'not-configured',
    authority: `https://login.microsoftonline.com/${tenantId ?? 'common'}`,
    redirectUri: `${window.location.origin}/auth/callback`,
  },
  cache: { cacheLocation: 'localStorage' },
}

export const msalInstance = new PublicClientApplication(config)

export async function signInWithMicrosoft(): Promise<AuthenticationResult> {
  await msalInstance.initialize()
  return msalInstance.loginPopup({
    scopes: ['openid', 'profile', 'email'],
    prompt: 'select_account',
  })
}
