import { PublicClientApplication, type Configuration, type AuthenticationResult } from '@azure/msal-browser'

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID as string | undefined

export const msalEnabled = !!(clientId && tenantId)

const config: Configuration = {
  auth: {
    clientId: clientId ?? 'not-configured',
    authority: `https://login.microsoftonline.com/${tenantId ?? 'common'}`,
    // Blank page — router won't intercept it, MSAL communicates result via BroadcastChannel
    redirectUri: `${window.location.origin}/redirect.html`,
  },
  cache: { cacheLocation: 'localStorage' },
}

let instance: PublicClientApplication | null = null

async function getInstance(): Promise<PublicClientApplication> {
  if (!instance) {
    instance = new PublicClientApplication(config)
    await instance.initialize()
  }
  return instance
}

function clearMsalLock() {
  const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string
  ;[localStorage, sessionStorage].forEach(store => {
    Object.keys(store)
      .filter(k => k.includes(clientId) && k.includes('interaction.status'))
      .forEach(k => store.removeItem(k))
  })
}

export async function signInWithMicrosoft(): Promise<AuthenticationResult> {
  clearMsalLock()
  const msal = await getInstance()
  return msal.loginPopup({
    scopes: ['openid', 'profile', 'email'],
    prompt: 'select_account',
  })
}
