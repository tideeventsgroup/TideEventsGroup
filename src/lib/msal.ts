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

let instance: PublicClientApplication | null = null
let ready = false

async function getInstance(): Promise<PublicClientApplication> {
  if (!instance) instance = new PublicClientApplication(config)
  if (!ready) {
    await instance.initialize()
    ready = true
  }
  return instance
}

function clearInteractionLock() {
  // Only remove MSAL's interaction-in-progress lock, nothing else
  Object.keys(sessionStorage)
    .filter(k => k.includes('interaction.status'))
    .forEach(k => sessionStorage.removeItem(k))
  Object.keys(localStorage)
    .filter(k => k.includes('interaction.status'))
    .forEach(k => localStorage.removeItem(k))
}

export async function signInWithMicrosoft(): Promise<AuthenticationResult> {
  clearInteractionLock()
  const msal = await getInstance()
  return msal.loginPopup({
    scopes: ['openid', 'profile', 'email'],
    prompt: 'select_account',
  })
}
