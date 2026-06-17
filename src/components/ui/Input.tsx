import React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
            {props.required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn('input', error && 'input-error', className)}
          aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="error-text" role="alert">
            <AlertCircle size={12} />
            {error}
          </p>
        )}
        {helper && !error && (
          <p id={`${inputId}-helper`} className="helper-text">{helper}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
  charCount?: number
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, charCount, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
            {props.required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn('input resize-none', error && 'input-error', className)}
          aria-invalid={!!error}
          {...props}
        />
        <div className="flex justify-between mt-1">
          {error ? (
            <p className="error-text" role="alert"><AlertCircle size={12} />{error}</p>
          ) : helper ? (
            <p className="helper-text">{helper}</p>
          ) : <span />}
          {charCount !== undefined && props.maxLength && (
            <span className="text-xs text-gray-400 tabular-nums">{charCount}/{props.maxLength}</span>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helper?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helper, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
            {props.required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn('input', error && 'input-error', className)}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <p className="error-text" role="alert"><AlertCircle size={12} />{error}</p>}
        {helper && !error && <p className="helper-text">{helper}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
