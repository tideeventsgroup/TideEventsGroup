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
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [msLoading, setMsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function redirectForRole(role: string) {
    if (role === 'super_admin') navigate('/admin', { replace: true })
    else if (role === 'client_staff' || role === 'event_staff') navigate('/app/select-event', { replace: true })
    else navigate('/mode-select', { replace: true })
  }

  async function onSubmit(data: FormData) {
    setAuthError(null)
    try {
      await signIn(data.email, data.password)
    } catch {
      setAuthError('Incorrect email or password. Please try again.')
    }
  }

  async function onMicrosoftSignIn() {
    setAuthError(null)
    setMsLoading(true)
    try {
      await signInWithMicrosoft() // redirects away — page unloads
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Microsoft sign-in failed')
      setMsLoading(false)
    }
  }

  React.useEffect(() => {
    if (user) redirectForRole(user.role)
  }, [user])

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: '#111111' }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #111111 55%, #E8521A 55%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)',
        }} />
      </div>

      <div className="relative z-10 p-8 lg:p-12">
        <TideLogo variant="full-white" height={36} />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md rounded-2xl p-8 lg:p-10 shadow-2xl bg-white">

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="h-1 w-8 rounded-full" style={{ background: '#E8521A' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#E8521A' }}>
                Tactical Incident &amp; Dispatch Environment
              </span>
            </div>
            <h1 className="text-3xl font-bold text-navy leading-tight">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-2">Sign in to access your event portal</p>
          </div>

          {authError && (
            <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl" role="alert">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{authError}</p>
            </div>
          )}

          {/* Microsoft SSO — Tide employees only */}
          {msalEnabled && (
            <>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Tide Employees</p>
                <button
                  type="button"
                  onClick={onMicrosoftSignIn}
                  disabled={msLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-navy disabled:opacity-50"
                >
                  <MicrosoftIcon />
                  {msLoading ? 'Redirecting to Microsoft…' : 'Sign in with Microsoft'}
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
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
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-300 focus:border-orange-400 ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
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
                    className={`w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition focus:ring-2 focus:ring-orange-300 focus:border-orange-400 ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
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
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
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
