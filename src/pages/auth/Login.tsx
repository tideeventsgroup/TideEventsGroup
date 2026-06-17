import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Waves } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export function Login() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setAuthError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setAuthError('Invalid email or password.')
    }
    // Navigation is handled by the auth state change in AuthContext + App.tsx
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-navy mb-4">
            <Waves size={28} className="text-teal" />
          </div>
          <h1 className="text-2xl font-semibold text-navy">Tide IMS</h1>
          <p className="text-sm text-gray-500 mt-1">Tide Events Group — incident management</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-base font-semibold text-navy mb-6">Sign in to your account</h2>

          {authError && (
            <div className="mb-4 px-3 py-2 bg-danger/10 border border-danger/20 rounded text-sm text-danger">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-xs text-center text-gray-400 mt-6">
          Tide Events Group Ltd · Incident Management System
        </p>
      </div>
    </div>
  )
}
