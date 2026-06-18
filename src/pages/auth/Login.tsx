import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { TideLogo } from '../../components/ui/TideLogo'
import { msalEnabled, signInWithMicrosoft } from '../../lib/microsoftAuth'
import { api } from '../../lib/api'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  )
}

export function Login() {
  const { signIn, setAuthenticatedUser, user } = useAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [msalLoading, setMsalLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function redirectForRole(role: string) {
    if (role === 'super_admin') navigate('/admin', { replace: true })
    else if (role === 'client_staff') navigate('/app/select-event', { replace: true })
    else navigate('/client', { replace: true })
  }

  async function onSubmit(data: FormData) {
    setAuthError(null)
    try {
      await signIn(data.email, data.password)
      // user state will update; navigate via effect
    } catch {
      setAuthError('Incorrect email or password. Please try again.')
    }
  }

  async function onMicrosoftSignIn() {
    setAuthError(null)
    setMsalLoading(true)
    try {
      await signInWithMicrosoft() // redirects away; page unloads
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Microsoft sign-in failed'
      setAuthError(msg)
      setMsalLoading(false)
    }
  }

  // Navigate after email/password login sets user in context
  React.useEffect(() => {
    if (user) redirectForRole(user.role)
  }, [user])

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: '#111111' }}>

      {/* Background diagonal */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #111111 55%, #E8521A 55%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)',
        }} />
      </div>

      {/* Logo */}
      <div className="relative z-10 p-8 lg:p-12">
        <TideLogo variant="full-white" height={36} />
      </div>

      {/* Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md rounded-2xl p-8 lg:p-10 shadow-2xl bg-white">

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="h-1 w-8 rounded-full" style={{ background: '#E8521A' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#E8521A' }}>
                Incident Management System
              </span>
            </div>
            <h1 className="text-3xl font-bold text-navy leading-tight">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-2">Sign in to access your event portal</p>
          </div>

          {authError && (
            <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-danger-50 border border-danger/20 rounded-xl" role="alert">
              <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{authError}</p>
            </div>
          )}

          {/* Microsoft SSO — Tide employees */}
          {msalEnabled && (
            <>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Tide Employees</p>
                <button
                  type="button"
                  onClick={onMicrosoftSignIn}
                  disabled={msalLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-navy disabled:opacity-50"
                >
                  <MicrosoftIcon />
                  {msalLoading ? 'Signing in…' : 'Sign in with Microsoft'}
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          {/* Email/password — event staff & clients */}
          <div>
            {msalEnabled && (
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Event Staff &amp; Clients</p>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Email address</label>
                <input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@organisation.com"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-brand/30 focus:border-brand ${errors.email ? 'border-danger bg-danger-50' : 'border-border bg-gray-50'}`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                    <AlertCircle size={11} />{errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition focus:ring-2 focus:ring-brand/30 focus:border-brand ${errors.password ? 'border-danger bg-danger-50' : 'border-border bg-gray-50'}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                    <AlertCircle size={11} />{errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full btn-lg mt-1" loading={isSubmitting}>
                Sign in
              </Button>
            </form>
          </div>

          <p className="text-xs text-center text-gray-400 mt-7">
            Need access? Contact your Tide Events Group consultant.
          </p>
        </div>
      </div>

      <div className="relative z-10 pb-6 text-center">
        <p className="text-white/20 text-xs">© {new Date().getFullYear()} Tide Events Group Ltd</p>
      </div>
    </div>
  )
}
