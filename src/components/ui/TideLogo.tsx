import React from 'react'

interface TideMarkProps {
  size?: number
  className?: string
}

export function TideMark({ size = 32, className = '' }: TideMarkProps) {
  return (
    <img
      src="/tide-mark.svg"
      alt="Tide Events Group"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', flexShrink: 0 }}
    />
  )
}

interface TideLogoProps {
  variant?: 'mark' | 'full' | 'full-white'
  className?: string
  markSize?: number
}

export function TideLogo({ variant = 'full', className = '', markSize = 32 }: TideLogoProps) {
  const textColor = variant === 'full-white' ? 'text-white' : 'text-navy'

  if (variant === 'mark') {
    return <TideMark size={markSize} className={className} />
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <TideMark size={markSize} />
      <div>
        <div
          className={`font-bold leading-tight tracking-tight ${textColor}`}
          style={{ fontSize: markSize * 0.56 }}
        >
          Tide Events Group
        </div>
        {markSize >= 36 && (
          <div
            className={`leading-none ${variant === 'full-white' ? 'text-white/60' : 'text-gray-400'}`}
            style={{ fontSize: markSize * 0.28 }}
          >
            Incident management system
          </div>
        )}
      </div>
    </div>
  )
}
