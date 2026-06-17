import React from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  iconOnly?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  iconOnly,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
    outline:   'btn-outline',
    ghost:     'btn-ghost',
  }
  const sizes: Record<string, string> = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }
  const iconOnlyClass = iconOnly ? '!px-0 aspect-square' : ''

  return (
    <button
      className={cn(variants[variant], sizes[size], iconOnlyClass, className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  )
}
