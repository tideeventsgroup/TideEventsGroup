import { PublicClientApplication, type Configuration } from '@azure/msal-browser'

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID as string | undefined

export const msalEnabled = !!(clientId && tenantId)

export function createMsalInstance() {
  const config: Configuration = {
    auth: {
      clientId: clientId ?? 'not-configured',
      authority: `https://login.microsoftonline.com/${tenantId ?? 'common'}`,
      redirectUri: `${window.location.origin}/auth/callback`,
      postLogoutRedirectUri: `${window.location.origin}/login`,
    },
    cache: { cacheLocation: 'sessionStorage' },
  }
  return new PublicClientApplication(config)
}

export async function signInWithMicrosoft(): Promise<void> {
  const instance = createMsalInstance()
  await instance.initialize()
  await instance.loginRedirect({
    scopes: ['openid', 'profile', 'email'],
    prompt: 'select_account',
  })
}
