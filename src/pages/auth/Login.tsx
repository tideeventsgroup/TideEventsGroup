import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { TideLogo } from '../../components/ui/TideLogo'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export function Login() {
  const { signIn } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setAuthError(null)
    try {
      await signIn(data.email, data.password)
    } catch {
      setAuthError('Incorrect email or password. Please try again.')
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: '#111111' }}>

      {/* Full-bleed background with diagonal split */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #111111 55%, #E8521A 55%)',
          }}
        />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)',
          }}
        />
      </div>

      {/* Logo top-left */}
      <div className="relative z-10 p-8 lg:p-12">
        <TideLogo variant="full-white" height={36} />
      </div>

      {/* Centred card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <div
          className="w-full max-w-md rounded-2xl p-8 lg:p-10 shadow-2xl"
          style={{ background: '#ffffff' }}
        >
          {/* Heading */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-5">
              <span
                className="h-1 w-8 rounded-full"
                style={{ background: '#E8521A' }}
              />
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
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

            {/* Password */}
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

            <Button
              type="submit"
              className="w-full btn-lg mt-1"
              loading={isSubmitting}
            >
              Sign in
            </Button>
          </form>

          <p className="text-xs text-center text-gray-400 mt-7">
            Need access? Contact your Tide Events Group consultant.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-6 text-center">
        <p className="text-white/20 text-xs">© {new Date().getFullYear()} Tide Events Group Ltd</p>
      </div>
    </div>
  )
}
