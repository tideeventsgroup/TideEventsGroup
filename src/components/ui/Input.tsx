import React from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="label">{label}</label>}
      <input id={inputId} className={cn('input', error && 'border-danger focus:ring-danger', className)} {...props} />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="label">{label}</label>}
      <textarea
        id={inputId}
        className={cn('input resize-none', error && 'border-danger focus:ring-danger', className)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="label">{label}</label>}
      <select id={inputId} className={cn('input', error && 'border-danger focus:ring-danger', className)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
