import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { DEMO_MODE, DEMO_LOGIN_HINT, DEMO_USERS } from '../lib/demo'
import type { User } from '../types'

interface AuthCtx {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setAuthenticatedUser: (token: string, user: User) => void
}

const AuthContext = createContext<AuthCtx>({ user: null, loading: true, signIn: async () => {}, signOut: async () => {}, setAuthenticatedUser: () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (DEMO_MODE) {
      const saved = sessionStorage.getItem('demo_user')
      if (saved) setUser(JSON.parse(saved))
      setLoading(false)
      return
    }
    const token = localStorage.getItem('tide_token')
    if (!token) { setLoading(false); return }
    api.get<User>('/auth/me')
      .then(setUser)
      .catch((err: unknown) => {
        // Only clear token on 401 — not on network errors or server cold-starts
        if ((err as { status?: number }).status === 401) {
          localStorage.removeItem('tide_token')
        } else {
          // Keep token and try to use cached user if available
          const cached = localStorage.getItem('tide_user')
          if (cached) { try { setUser(JSON.parse(cached)) } catch { /* ignore */ } }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function signIn(email: string, password: string) {
    if (DEMO_MODE) {
      const role = DEMO_LOGIN_HINT[email.toLowerCase()]
      if (!role) throw new Error('Invalid demo credentials')
      const demoUser = DEMO_USERS[role as keyof typeof DEMO_USERS]
      sessionStorage.setItem('demo_user', JSON.stringify(demoUser))
      setUser(demoUser as unknown as User)
      return
    }
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
    localStorage.setItem('tide_token', token)
    localStorage.setItem('tide_user', JSON.stringify(user))
    setUser(user)
  }

  async function signOut() {
    if (DEMO_MODE) { sessionStorage.removeItem('demo_user'); setUser(null); return }
    localStorage.removeItem('tide_token')
    localStorage.removeItem('tide_user')
    setUser(null)
  }

  function setAuthenticatedUser(token: string, user: User) {
    localStorage.setItem('tide_token', token)
    localStorage.setItem('tide_user', JSON.stringify(user))
    setUser(user)
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut, setAuthenticatedUser }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
