import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

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
    <div className="min-h-screen bg-navy flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-navy-light p-12">
        <div>
          <blockquote className="text-white/80 text-lg font-medium leading-relaxed mb-4">
            "Professional event safety management, from planning to post-event review."
          </blockquote>
          <p className="text-white/40 text-sm">Trusted by event organisers across Scotland.</p>
        </div>

        <div className="text-white/30 text-xs">
          © {new Date().getFullYear()} Tide Events Group Ltd
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-navy">Sign in</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your credentials to access your portal</p>
          </div>

          {authError && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-danger-50 border border-danger/20 rounded-lg" role="alert">
              <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              inputMode="email"
              error={errors.email?.message}
              placeholder="you@organisation.com"
              {...register('email')}
            />

            <div className="w-full">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
                  aria-invalid={!!errors.password}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition-colors tap-target"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="error-text" role="alert">
                  <AlertCircle size={12} />
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full btn-lg mt-2" loading={isSubmitting}>
              Sign in to your account
            </Button>
          </form>

          <p className="text-xs text-center text-gray-400 mt-8">
            Need access? Contact your Tide Events Group consultant.
          </p>
        </div>
      </div>
    </div>
  )
}
